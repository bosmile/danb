import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { getInvoices } from '@/lib/actions/invoices';
import { startOfMonth, endOfMonth } from 'date-fns';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const today = new Date();
  const initialInvoices = await getInvoices(startOfMonth(today), endOfMonth(today));

  return (
    <div className="space-y-6">
      <DashboardClient initialInvoices={initialInvoices} />
    </div>
  );
}
