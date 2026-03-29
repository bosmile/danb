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
        "fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur-md md:hidden pb-safe",
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
                'flex flex-col items-center gap-1.5 rounded-xl px-3 py-2 transition-all active:scale-95',
                isActive ? 'text-primary bg-primary/5' : 'text-slate-400 dark:text-slate-500'
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive ? "stroke-[2.5px]" : "stroke-2")} />
              <span className={cn("text-[11px] leading-none", isActive ? 'font-bold' : 'font-medium')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
