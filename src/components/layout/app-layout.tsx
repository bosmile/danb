import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import Image from 'next/image';
import { MobileNav } from './mobile-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-full" />
              <h1 className="text-xl font-bold">DỰ ÁN NUÔI BƠ</h1>
            </div>
            <SidebarTrigger className="md:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6 md:justify-end">
          <SidebarTrigger className="flex md:hidden" />
          <div className="flex-1 md:hidden">
            {/* Mobile-specific header content can go here if needed */}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6">{children}</main>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
