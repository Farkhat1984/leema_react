import React, { type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showFooter?: boolean;
  footerContent?: ReactNode;
  closeButtonText?: string;
  actions?: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
  showFooter = true,
  footerContent,
  closeButtonText = 'Close',
  actions,
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

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={closeOnEscape ? onClose : () => {}}
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
                  {subtitle && (
                    <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                  )}

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {actions}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onClose}
                        >
                          {closeButtonText}
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

// Helper component for detail rows
interface DetailRowProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}

export const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  valueClassName = '',
}) => {
  return (
    <div className="py-3 flex justify-between items-start border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-500 w-1/3">{label}</dt>
      <dd className={`text-sm text-gray-900 w-2/3 text-right ${valueClassName}`}>
        {value || '-'}
      </dd>
    </div>
  );
};

// Helper component for detail sections
interface DetailSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export const DetailSection: React.FC<DetailSectionProps> = ({
  title,
  children,
  className = '',
  icon,
}) => {
  return (
    <div className={`mb-6 last:mb-0 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon && <div className="text-gray-600">{icon}</div>}
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      <dl className="bg-gray-50 rounded-lg px-4 py-2">{children}</dl>
    </div>
  );
};
