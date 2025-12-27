import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
           <div className="flex justify-center items-center mb-4">
            <div className="bg-primary text-primary-foreground rounded-full p-3">
              <Package className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">InvoiceFlow</CardTitle>
          <CardDescription>Đăng nhập để quản lý hóa đơn</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
