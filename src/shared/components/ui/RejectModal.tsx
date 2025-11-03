/**
 * RejectModal Component
 * Modal for rejecting items with a required reason
 *
 * Usage:
 * <RejectModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onReject={(reason) => handleReject(reason)}
 *   title="Отклонить продукт?"
 *   itemName="Футболка Nike"
 * />
 */

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangleIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import { Textarea } from '@/shared/components/ui/Textarea';

export interface RejectModalProps {
  open?: boolean;
  isOpen?: boolean; // Alias for open (backward compatibility)
  onClose: () => void;
  onReject?: (reason: string) => void | Promise<void>;
  onConfirm?: (reason: string) => void | Promise<void>; // Alias for onReject
  title: string;
  description?: string;
  message?: string; // Alias for description (backward compatibility)
  itemName?: string; // Optional item name to display
  reasonLabel?: string;
  reasonPlaceholder?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  isLoading?: boolean; // Alias for loading (backward compatibility)
  minLength?: number;
}

export const RejectModal = ({
  open,
  isOpen, // Support both props
  onClose,
  onReject,
  onConfirm, // Support both onReject and onConfirm
  title,
  description,
  message, // Support both description and message
  itemName,
  reasonLabel = 'Причина отклонения',
  reasonPlaceholder = 'Укажите причину отклонения...',
  confirmText = 'Отклонить',
  cancelText = 'Отмена',
  loading,
  isLoading, // Support both loading props
  minLength = 10,
}: RejectModalProps) => {
  const actualOpen = open ?? isOpen ?? false;
  const actualLoading = loading ?? isLoading ?? false;
  const actualDescription = description || message;
  const actualOnReject = onReject || onConfirm || (() => {});
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleReject = async () => {
    // Validation
    if (!reason.trim()) {
      setError('Причина обязательна');
      return;
    }
    if (reason.trim().length < minLength) {
      setError(`Минимум ${minLength} символов`);
      return;
    }

    setError('');
    await actualOnReject(reason.trim());
    if (!actualLoading) {
      setReason('');
      onClose();
    }
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Transition appear show={actualOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        {/* Dialog Panel */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertTriangleIcon className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold text-gray-900"
                    >
                      {title}
                    </Dialog.Title>

                    {itemName && (
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">{itemName}</span>
                      </p>
                    )}

                    {actualDescription && (
                      <Dialog.Description className="mt-2 text-sm text-gray-500">
                        {actualDescription}
                      </Dialog.Description>
                    )}
                  </div>
                </div>

                {/* Reason Input */}
                <div className="mt-6">
                  <label
                    htmlFor="reason"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {reasonLabel} <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setError('');
                    }}
                    placeholder={reasonPlaceholder}
                    rows={4}
                    disabled={actualLoading}
                    className={cn(
                      error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    )}
                  />
                  {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Минимум {minLength} символов ({reason.length}/{minLength})
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={actualLoading}
                  >
                    {cancelText}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleReject}
                    isLoading={actualLoading}
                    disabled={actualLoading || !reason.trim() || reason.trim().length < minLength}
                  >
                    {confirmText}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default RejectModal;
