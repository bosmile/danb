import AppLayout from '@/components/layout/app-layout';
import AuthGuard from '@/components/auth/auth-guard';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
}
