'use client';

import { MobileNav } from './mobile-nav';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeaderNav } from './header-nav';
import Link from 'next/link';
import * as React from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-b-slate-200 dark:border-b-slate-800 bg-background/80 p-4 backdrop-blur-sm print-hidden md:h-14 md:px-6">
        {/* Mobile Header */}
        <div className="flex items-center gap-3 md:hidden">
            <Logo className="h-10 w-10" />
            <div>
                <h1 className="text-lg font-bold leading-tight font-headline">DỰ ÁN NUÔI BƠ</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Quản lý mua hàng</p>
            </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/" className="items-center gap-2 flex">
            <Logo className="h-8 w-8" />
            <h1 className="text-lg font-bold font-headline hidden lg:block">
              DỰ ÁN NUÔI BƠ
            </h1>
          </Link>
          <HeaderNav />
        </div>
        <ThemeToggle />
      </header>
      <main className="flex-1 p-4 sm:p-6 pb-28 md:pb-6">{children}</main>
      <MobileNav className="print-hidden" />
    </div>
  );
}
