import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus,
  Trash2,
  Send,
  Calendar,
  Users,
  MessageSquare,
  Image as ImageIcon,
  X,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { ImageUploadMultiple } from '@/shared/components/ui/ImageUploadMultiple'
import { SearchInput } from '@/shared/components/ui/SearchInput'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { useDebounce } from '@/shared/hooks'
import { contactsService } from '../services/contacts.service'
import { newslettersService } from '../services/newsletters.service'
import { newsletterSchema, type NewsletterFormData } from '@/shared/lib/validation/schemas'
import type { Contact, UploadedImage } from '../types/newsletter.types'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export function CreateNewsletterTab() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [contactSearch, setContactSearch] = useState('')
  const debouncedSearch = useDebounce(contactSearch, 300)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    control,
    reset,
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      title: '',
      description: '',
      texts: [],
      images: [],
      recipient_type: 'all',
      recipient_ids: [],
      scheduled_at: undefined,
    },
  })

  // Dynamic text fields
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'texts',
  })

  const recipientType = watch('recipient_type')
  const selectedRecipientIds = watch('recipient_ids')
  const images = watch('images')

  // Fetch contacts for selection
  const { data: contactsData } = useQuery({
    queryKey: ['contacts', debouncedSearch],
    queryFn: () =>
      contactsService.getContacts({
        page: 1,
        per_page: 100,
        search: debouncedSearch,
      }),
    enabled: recipientType === 'selected',
  })

  // Create newsletter mutation
  const createMutation = useMutation({
    mutationFn: async (data: NewsletterFormData) => {
      // Show uploading toast if there are images
      if (data.images.length > 0) {
        toast.loading(`Uploading ${data.images.length} image(s)...`, { id: 'upload' })
      }

      try {
        const result = await newslettersService.createNewsletter(data)
        toast.dismiss('upload')
        return result
      } catch (error) {
        toast.dismiss('upload')
        throw error
      }
    },
    onSuccess: () => {
      toast.success('Newsletter created successfully! Waiting for admin approval.')
      reset()
      queryClient.invalidateQueries({ queryKey: ['newsletters'] })
      // Switch to history tab or navigate
      setTimeout(() => {
        navigate('/shop/newsletters?tab=history')
      }, 1500)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create newsletter')
    },
  })

  const onSubmit = async (data: NewsletterFormData) => {
    try {
      // Add scheduled_at if scheduling is enabled
      if (!scheduleEnabled) {
        data.scheduled_at = undefined
      }
      console.log('Submitting newsletter:', data)
      await createMutation.mutateAsync(data)
    } catch (error) {
      console.error('Newsletter submission error:', error)
      // Error is already handled by mutation's onError
    }
  }

  const handleRecipientToggle = (contactId: number) => {
    const currentIds = selectedRecipientIds || []
    if (currentIds.includes(contactId)) {
      setValue(
        'recipient_ids',
        currentIds.filter((id) => id !== contactId)
      )
    } else {
      setValue('recipient_ids', [...currentIds, contactId])
    }
  }

  const handleSelectAllRecipients = () => {
    if (contactsData?.data && Array.isArray(contactsData.data)) {
      const allIds = contactsData.data.map((c) => c.id)
      setValue('recipient_ids', allIds)
    }
  }

  const handleClearAllRecipients = () => {
    setValue('recipient_ids', [])
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Newsletter Details</h3>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            type="text"
            placeholder="Enter newsletter title"
            {...register('title')}
            error={errors.title?.message}
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (optional)
          </label>
          <Textarea
            id="description"
            placeholder="Brief description of this newsletter"
            rows={2}
            {...register('description')}
            error={errors.description?.message}
          />
        </div>
      </div>

      {/* Text Messages */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Text Messages
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ content: '', order: fields.length })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Text Block
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No text messages yet. Add a text block to start.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <div className="flex-1">
                  <Textarea
                    placeholder={`Text message ${index + 1}`}
                    rows={3}
                    {...register(`texts.${index}.content`)}
                    error={errors.texts?.[index]?.content?.message}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Images
        </h3>

        <ImageUploadMultiple
          maxFiles={5}
          onChange={(files: UploadedImage[]) => {
            setValue('images', files);
          }}
          value={images || []}
        />

        <p className="text-sm text-gray-500">
          Upload up to 5 images. Supported formats: JPG, PNG, WebP. Max size: 5MB per image.
        </p>

        {errors.images && (
          <p className="text-sm text-red-600">{errors.images.message as string}</p>
        )}
      </div>

      {/* Recipients */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Recipients
        </h3>

        {/* Recipient Type Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="all"
              {...register('recipient_type')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Send to all contacts
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="selected"
              {...register('recipient_type')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Send to selected contacts
            </span>
          </label>
        </div>

        {/* Contact Selection (if "selected" is chosen) */}
        {recipientType === 'selected' && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <SearchInput
                value={contactSearch}
                onChange={setContactSearch}
                placeholder="Search contacts..."
                className="w-80"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllRecipients}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllRecipients}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-200 rounded p-3">
              {contactsData?.data && Array.isArray(contactsData.data) && contactsData.data.length > 0 ? (
                contactsData.data.map((contact) => (
                  <label
                    key={contact.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedRecipientIds?.includes(contact.id)}
                      onChange={() => handleRecipientToggle(contact.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {contact.full_name}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-green-600" />
                        {contact.whatsapp_number}
                      </div>
                    </div>
                  </label>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No contacts found. Add contacts first.
                </div>
              )}
            </div>

            {selectedRecipientIds && selectedRecipientIds.length > 0 && (
              <div className="text-sm text-gray-600">
                {selectedRecipientIds.length} contact(s) selected
              </div>
            )}

            {errors.recipient_ids && (
              <p className="text-sm text-red-600">{errors.recipient_ids.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Scheduling */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Scheduling
        </h3>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!scheduleEnabled}
              onChange={() => {
                setScheduleEnabled(false)
                setValue('scheduled_at', undefined)
              }}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Submit for approval now (will send after admin approval)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={scheduleEnabled}
              onChange={() => setScheduleEnabled(true)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Schedule for later (after approval)
            </span>
          </label>
        </div>

        {scheduleEnabled && (
          <div>
            <label
              htmlFor="scheduled_at"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Scheduled Date & Time
            </label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              {...register('scheduled_at')}
              error={errors.scheduled_at?.message}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Newsletter will be sent automatically after admin approval and scheduled time
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between gap-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600">
          <p className="font-medium">Before submitting:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Add at least one text message or image</li>
            <li>Select recipients (all or specific contacts)</li>
            <li>Your newsletter will be reviewed by admin before sending</li>
          </ul>
        </div>
        <Button
          type="submit"
          size="lg"
          isLoading={isSubmitting || createMutation.isPending}
          disabled={isSubmitting || createMutation.isPending}
        >
          <Send className="w-5 h-5 mr-2" />
          Submit for Approval
        </Button>
      </div>

      {/* General form errors */}
      {errors.texts && typeof errors.texts.message === 'string' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          {errors.texts.message}
        </div>
      )}

      {/* Display all form errors for debugging */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          <p className="font-semibold mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.title && <li>Title: {errors.title.message}</li>}
            {errors.description && <li>Description: {errors.description.message}</li>}
            {errors.texts && typeof errors.texts.message === 'string' && <li>{errors.texts.message}</li>}
            {errors.images && <li>Images: {errors.images.message as string}</li>}
            {errors.recipient_ids && <li>Recipients: {errors.recipient_ids.message}</li>}
            {errors.scheduled_at && <li>Schedule: {errors.scheduled_at.message}</li>}
          </ul>
        </div>
      )}
    </form>
  )
}
