import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarTrigger } from '@/components/ui/sidebar';
import { MobileNav } from './mobile-nav';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeaderNav } from './header-nav';
import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar className="print-hidden">
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <h1 className="text-xl font-bold font-headline">DỰ ÁN NUÔI BƠ</h1>
            </div>
            <SidebarTrigger className="md:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* Sidebar content is removed as per request */}
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6 print-hidden">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="flex md:hidden" />
            <Link href="/" className="items-center gap-2 hidden md:flex">
              <Logo className="h-8 w-8" />
              <h1 className="text-lg font-bold font-headline hidden lg:block">DỰ ÁN NUÔI BƠ</h1>
            </Link>
            <HeaderNav className="hidden md:flex" />
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6">{children}</main>
        <MobileNav className="print-hidden" />
      </SidebarInset>
    </SidebarProvider>
  );
}
