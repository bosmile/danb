'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Trang chủ' },
  { href: '/products', label: 'Hàng hóa' },
  { href: '/reports', label: 'Báo cáo' },
];

export function HeaderNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn('flex items-center space-x-2 lg:space-x-4', className)}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground',
              'justify-start'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
