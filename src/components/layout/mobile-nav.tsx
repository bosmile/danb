'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, BarChart3, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/products', label: 'Hàng hóa', icon: List },
  { href: '/reports', label: 'Báo cáo', icon: BarChart3 },
  { href: '/payments', label: 'Thanh toán', icon: CreditCard },
];

export function MobileNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur-sm md:hidden",
        className
      )}>
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md p-2 text-muted-foreground transition-colors hover:text-primary',
                isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-600'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className={cn("text-[10px]", isActive ? 'font-bold' : 'font-medium')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="flex h-5 items-center justify-center pb-1">
        <div className="h-1 w-32 rounded-full bg-slate-300 dark:bg-slate-700"></div>
      </div>
    </nav>
  );
}
