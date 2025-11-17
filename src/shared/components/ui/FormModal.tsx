import React, { type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface FormModalProps {
  open?: boolean; // Accept 'open' prop
  isOpen?: boolean; // Keep backward compatibility
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean; // Accept 'isLoading' prop
  isSubmitting?: boolean; // Keep backward compatibility
  submitDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showFooter?: boolean;
  footerContent?: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export const FormModal: React.FC<FormModalProps> = ({
  open,
  isOpen,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitText = 'Save',
  cancelText = 'Cancel',
  isLoading,
  isSubmitting,
  submitDisabled = false,
  size = 'md',
  showFooter = true,
  footerContent,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
}) => {
  // Support both 'open' and 'isOpen' props
  const modalOpen = open ?? isOpen ?? false;
  // Support both 'isLoading' and 'isSubmitting' props
  const modalSubmitting = isLoading ?? isSubmitting ?? false;
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-full mx-4',
  };

  const handleClose = () => {
    if (modalSubmitting) return;
    onClose();
  };

  const handleOverlayClick = () => {
    if (closeOnOverlayClick && !modalSubmitting) {
      handleClose();
    }
  };

  return (
    <Transition appear show={modalOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={closeOnEscape ? handleClose : () => {}}
      >
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
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleOverlayClick}
          />
        </Transition.Child>

        {/* Modal Container */}
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
              <Dialog.Panel
                className={`
                  w-full ${sizeClasses[size]}
                  transform overflow-hidden rounded-lg bg-white text-left
                  align-middle shadow-xl transition-all
                  ${className}
                `}
              >
                {/* Header */}
                <div className="relative border-b border-gray-200 px-6 py-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-gray-900 pr-8"
                  >
                    {title}
                  </Dialog.Title>
                  {description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {description}
                    </p>
                  )}

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={modalSubmitting}
                    className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 min-h-[500px] max-h-[calc(100vh-8rem)] overflow-y-auto">
                  {children}
                </div>

                {/* Footer */}
                {showFooter && onSubmit && (
                  <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    {footerContent || (
                      <div className="flex items-center justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleClose}
                          disabled={modalSubmitting}
                        >
                          {cancelText}
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          isLoading={modalSubmitting}
                          disabled={submitDisabled || modalSubmitting}
                          onClick={(e) => {
                            e.preventDefault();
                            onSubmit();
                          }}
                        >
                          {submitText}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
