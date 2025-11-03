import { type HTMLAttributes, forwardRef, useState, useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/utils/cn';

export interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  trigger: React.ReactNode;
  align?: 'left' | 'right';
}

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  ({ trigger, align = 'left', className, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen]);

    return (
      <div ref={dropdownRef} className="relative inline-block" {...props}>
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {trigger}
        </div>

        {isOpen && (
          <div
            ref={ref}
            className={cn(
              'absolute z-50 mt-2 min-w-[200px] rounded-lg border bg-white p-1 shadow-lg',
              align === 'right' ? 'right-0' : 'left-0',
              className
            )}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export const DropdownItem = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-gray-100 transition-colors',
      className
    )}
    {...props}
  />
));
DropdownItem.displayName = 'DropdownItem';

export const DropdownSeparator = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('my-1 h-px bg-gray-200', className)}
    {...props}
  />
));
DropdownSeparator.displayName = 'DropdownSeparator';
