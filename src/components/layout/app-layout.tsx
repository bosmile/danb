import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { MobileNav } from './mobile-nav';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/theme-toggle';

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
        <SidebarContent className="relative">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{backgroundImage: "url('https://images.unsplash.com/photo-1599329388339-e99c1c38a46f?q=80&w=1974&auto=format&fit=crop')"}}
            data-ai-hint="avocado fruit"
          ></div>
          {/* Overlay */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-0"></div>
          {/* Navigation */}
          <div className="relative z-10">
            <SidebarNav />
          </div>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6 md:justify-end print-hidden">
          <SidebarTrigger className="flex md:hidden" />
          <div className="flex-1 md:hidden">
            {/* Mobile-specific header content can go here if needed */}
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6">{children}</main>
        <MobileNav className="print-hidden" />
      </SidebarInset>
    </SidebarProvider>
  );
}
