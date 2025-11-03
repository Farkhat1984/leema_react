import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib/utils/cn';

export interface HeaderProps extends HTMLAttributes<HTMLElement> {}

export const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60',
          className
        )}
        {...props}
      />
    );
  }
);

Header.displayName = 'Header';

export const HeaderContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mx-auto flex h-16 max-w-screen-2xl items-center px-6', className)}
    {...props}
  />
));
HeaderContent.displayName = 'HeaderContent';

export const HeaderTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn('text-xl font-bold text-gray-900', className)}
    {...props}
  />
));
HeaderTitle.displayName = 'HeaderTitle';

export const HeaderNav = forwardRef<
  HTMLElement,
  HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn('flex items-center gap-6', className)}
    {...props}
  />
));
HeaderNav.displayName = 'HeaderNav';

export const HeaderActions = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('ml-auto flex items-center gap-4', className)}
    {...props}
  />
));
HeaderActions.displayName = 'HeaderActions';
