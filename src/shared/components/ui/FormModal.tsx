import React, { type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showFooter?: boolean;
  footerContent?: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitText = 'Save',
  cancelText = 'Cancel',
  isSubmitting = false,
  submitDisabled = false,
  size = 'md',
  showFooter = true,
  footerContent,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-full mx-4',
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleOverlayClick = () => {
    if (closeOnOverlayClick && !isSubmitting) {
      handleClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
                <form onSubmit={handleSubmit}>
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
                      disabled={isSubmitting}
                      className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
                    {children}
                  </div>

                  {/* Footer */}
                  {showFooter && (
                    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                      {footerContent || (
                        <div className="flex items-center justify-end space-x-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                          >
                            {cancelText}
                          </Button>
                          {onSubmit && (
                            <Button
                              type="submit"
                              variant="primary"
                              isLoading={isSubmitting}
                              disabled={submitDisabled || isSubmitting}
                            >
                              {submitText}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
