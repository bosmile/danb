'use client';

import { MobileNav } from './mobile-nav';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeaderNav } from './header-nav';
import Link from 'next/link';
import * as React from 'react';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-b-slate-200 dark:border-b-slate-800 bg-background/80 p-4 backdrop-blur-sm print-hidden md:h-14 md:px-6">
        {/* Mobile Header */}
        <div className="flex items-center gap-3 md:hidden">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                {user?.photoURL && <AvatarImage src={user.photoURL} alt="User profile" />}
                <AvatarFallback>
                    <User className="h-5 w-5"/>
                </AvatarFallback>
            </Avatar>
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
