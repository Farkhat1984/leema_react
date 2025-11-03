/**
 * ConfirmDialog Component
 * Confirmation dialog for destructive or important actions
 *
 * Usage:
 * <ConfirmDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Удалить продукт?"
 *   description="Это действие необратимо. Продукт будет удален навсегда."
 *   confirmText="Удалить"
 *   cancelText="Отмена"
 *   variant="danger"
 * />
 */

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangleIcon, InfoIcon, CheckCircleIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/Button';

export interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean; // Alias for open (backward compatibility)
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  message?: string; // Alias for description (backward compatibility)
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success' | 'primary'; // Added 'primary'
  loading?: boolean;
  isLoading?: boolean; // Alias for loading (backward compatibility)
}

const variantConfig = {
  danger: {
    icon: AlertTriangleIcon,
    iconClass: 'text-red-600 bg-red-100',
    confirmButtonVariant: 'danger' as const,
  },
  warning: {
    icon: AlertTriangleIcon,
    iconClass: 'text-yellow-600 bg-yellow-100',
    confirmButtonVariant: 'primary' as const,
  },
  info: {
    icon: InfoIcon,
    iconClass: 'text-blue-600 bg-blue-100',
    confirmButtonVariant: 'primary' as const,
  },
  success: {
    icon: CheckCircleIcon,
    iconClass: 'text-green-600 bg-green-100',
    confirmButtonVariant: 'primary' as const,
  },
  primary: {
    icon: InfoIcon,
    iconClass: 'text-blue-600 bg-blue-100',
    confirmButtonVariant: 'primary' as const,
  },
};

export const ConfirmDialog = ({
  open,
  isOpen, // Support both props
  onClose,
  onConfirm,
  title,
  description,
  message, // Support both description and message
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'danger',
  loading,
  isLoading, // Support both loading props
}: ConfirmDialogProps) => {
  const actualOpen = open ?? isOpen ?? false;
  const actualLoading = loading ?? isLoading ?? false;
  const actualDescription = description || message;
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    await onConfirm();
    if (!actualLoading) {
      onClose();
    }
  };

  return (
    <Transition appear show={actualOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                  <div
                    className={cn(
                      'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full',
                      config.iconClass
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold text-gray-900"
                    >
                      {title}
                    </Dialog.Title>

                    {actualDescription && (
                      <Dialog.Description className="mt-2 text-sm text-gray-500">
                        {actualDescription}
                      </Dialog.Description>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={actualLoading}
                  >
                    {cancelText}
                  </Button>
                  <Button
                    variant={config.confirmButtonVariant}
                    onClick={handleConfirm}
                    isLoading={actualLoading}
                    disabled={actualLoading}
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

export default ConfirmDialog;
