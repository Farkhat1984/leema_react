import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormModal } from '@/shared/components/ui/FormModal'
import { Input } from '@/shared/components/ui/Input'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { PhoneInput } from '@/shared/components/ui/PhoneInput'
import { contactSchema, type ContactFormData } from '@/shared/lib/validation/schemas'
import type { Contact } from '../types/newsletter.types'

interface ContactFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ContactFormData) => Promise<void>
  contact?: Contact
  title?: string
}

export function ContactFormModal({
  isOpen,
  onClose,
  onSubmit,
  contact,
  title,
}: ContactFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(contactSchema) as any,
    defaultValues: contact
      ? {
          name: contact.name,
          phone: contact.phone,
          has_whatsapp: contact.has_whatsapp,
        }
      : {
          name: '',
          phone: '',
          has_whatsapp: false,
        },
  })

  const phoneValue = watch('phone')
  const hasWhatsApp = watch('has_whatsapp')

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (contact ? 'Edit Contact' : 'Add Contact')}
      onSubmit={handleSubmit(onSubmit as any)}
      isSubmitting={isSubmitting}
      size="md"
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Enter contact name"
            {...register('name')}
            error={errors.name?.message}
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <PhoneInput
            value={phoneValue}
            onChange={(value) => setValue('phone', value)}
            placeholder="Enter phone number"
            error={errors.phone?.message}
          />
          <p className="text-xs text-gray-500 mt-1">
            Include country code (e.g., +7 or +1)
          </p>
        </div>

        {/* WhatsApp */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="has_whatsapp"
            checked={hasWhatsApp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue('has_whatsapp', e.target.checked)}
          />
          <label htmlFor="has_whatsapp" className="text-sm font-medium text-gray-700">
            This contact has WhatsApp
          </label>
        </div>
      </div>
    </FormModal>
  )
}
