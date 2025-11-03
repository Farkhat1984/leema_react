import { createContext, useContext, useState, type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib/utils/cn';

interface AccordionContextValue {
  openItems: string[];
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

const useAccordionContext = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion component');
  }
  return context;
};

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = 'single', defaultValue, className, children, ...props }, ref) => {
    const [openItems, setOpenItems] = useState<string[]>(
      Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []
    );

    const toggleItem = (value: string) => {
      setOpenItems((prev) => {
        if (type === 'single') {
          return prev.includes(value) ? [] : [value];
        } else {
          return prev.includes(value)
            ? prev.filter((item) => item !== value)
            : [...prev, value];
        }
      });
    };

    return (
      <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
        <div ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);

Accordion.displayName = 'Accordion';

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('border-b border-gray-200', className)}
        {...props}
      />
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

export interface AccordionTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ value, className, children, ...props }, ref) => {
    const { openItems, toggleItem } = useAccordionContext();
    const isOpen = openItems.includes(value);

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => toggleItem(value)}
        className={cn(
          'flex w-full items-center justify-between py-4 font-medium transition-all hover:underline text-left',
          className
        )}
        {...props}
      >
        {children}
        <svg
          className={cn('h-5 w-5 transition-transform', isOpen && 'rotate-180')}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

export interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ value, className, children, ...props }, ref) => {
    const { openItems } = useAccordionContext();
    const isOpen = openItems.includes(value);

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn('pb-4 pt-0', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AccordionContent.displayName = 'AccordionContent';
