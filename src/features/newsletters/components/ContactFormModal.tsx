import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormModal } from '@/shared/components/ui/FormModal'
import { Input } from '@/shared/components/ui/Input'
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
          full_name: contact.full_name,
          whatsapp_number: contact.whatsapp_number,
        }
      : {
          full_name: '',
          whatsapp_number: '',
        },
  })

  const phoneValue = watch('whatsapp_number')

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (contact ? 'Редактировать контакт' : 'Добавить контакт')}
      onSubmit={handleSubmit(onSubmit as any)}
      isSubmitting={isSubmitting}
      size="md"
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
            Полное имя <span className="text-red-500">*</span>
          </label>
          <Input
            id="full_name"
            type="text"
            placeholder="Введите полное имя контакта"
            {...register('full_name')}
            error={errors.full_name?.message}
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="whatsapp_number" className="block text-sm font-medium text-gray-700 mb-1">
            Номер WhatsApp <span className="text-red-500">*</span>
          </label>
          <PhoneInput
            value={phoneValue}
            onChange={(value) => setValue('whatsapp_number', value)}
            placeholder="Введите номер WhatsApp"
            error={errors.whatsapp_number?.message}
          />
          <p className="text-xs text-gray-500 mt-1">
            Включите код страны (например, +7 или +1)
          </p>
        </div>
      </div>
    </FormModal>
  )
}
