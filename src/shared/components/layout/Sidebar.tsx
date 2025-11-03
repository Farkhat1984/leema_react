import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib/utils/cn';

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  isCollapsed?: boolean;
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ isCollapsed = false, className, ...props }, ref) => {
    return (
      <aside
        ref={ref}
        className={cn(
          'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r bg-white transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
        {...props}
      />
    );
  }
);

Sidebar.displayName = 'Sidebar';

export const SidebarNav = forwardRef<
  HTMLElement,
  HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn('flex flex-col gap-1 p-4', className)}
    {...props}
  />
));
SidebarNav.displayName = 'SidebarNav';

export interface SidebarItemProps extends HTMLAttributes<HTMLAnchorElement> {
  isActive?: boolean;
  icon?: React.ReactNode;
}

export const SidebarItem = forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ isActive = false, icon, className, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-purple-100 text-purple-900'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="flex-1">{children}</span>
      </a>
    );
  }
);
SidebarItem.displayName = 'SidebarItem';

export const SidebarSection = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1 py-2', className)} {...props} />
));
SidebarSection.displayName = 'SidebarSection';

export const SidebarSectionTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider', className)}
    {...props}
  />
));
SidebarSectionTitle.displayName = 'SidebarSectionTitle';
