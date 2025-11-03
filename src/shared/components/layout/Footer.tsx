import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib/utils/cn';

export interface FooterProps extends HTMLAttributes<HTMLElement> {}

export const Footer = forwardRef<HTMLElement, FooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn(
          'w-full border-t bg-white py-6',
          className
        )}
        {...props}
      />
    );
  }
);

Footer.displayName = 'Footer';

export const FooterContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mx-auto max-w-screen-2xl px-6', className)}
    {...props}
  />
));
FooterContent.displayName = 'FooterContent';

export const FooterSection = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props} />
));
FooterSection.displayName = 'FooterSection';

export const FooterTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-sm font-semibold text-gray-900', className)}
    {...props}
  />
));
FooterTitle.displayName = 'FooterTitle';

export const FooterLink = forwardRef<
  HTMLAnchorElement,
  HTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => (
  <a
    ref={ref}
    className={cn('text-sm text-gray-600 hover:text-gray-900 transition-colors', className)}
    {...props}
  />
));
FooterLink.displayName = 'FooterLink';
