'use client';

import { MobileNav } from './mobile-nav';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeaderNav } from './header-nav';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '../ui/button';
import { Home, List, PanelLeft, BarChart3 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import * as React from 'react';


const navItems = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/products', label: 'Hàng hóa', icon: List },
  { href: '/reports', label: 'Báo cáo', icon: BarChart3 },
];

function MobileSheetNav() {
    const pathname = usePathname();
    const [open, setOpen] = React.useState(false);

    return (
         <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Mở menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] p-4">
                <Link href="/" className="mb-8 flex items-center gap-2">
                    <Logo className="h-8 w-8" />
                    <span className="font-bold font-headline">DỰ ÁN NUÔI BƠ</span>
                </Link>
                <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            isActive && "bg-muted text-primary"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                    );
                })}
                </nav>
            </SheetContent>
        </Sheet>
    )
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6 print-hidden">
        <div className="flex items-center gap-4">
          <MobileSheetNav />
          <Link href="/" className="items-center gap-2 hidden md:flex">
            <Logo className="h-8 w-8" />
            <h1 className="text-lg font-bold font-headline hidden lg:block">
              DỰ ÁN NUÔI BƠ
            </h1>
          </Link>
          <HeaderNav className="hidden md:flex" />
        </div>
        <ThemeToggle />
      </header>
      <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6">{children}</main>
      <MobileNav className="print-hidden" />
    </div>
  );
}
