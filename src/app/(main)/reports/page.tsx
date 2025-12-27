import { PageHeader } from '@/components/shared/page-header';
import { getInvoices } from '@/lib/actions/invoices';
import { startOfMonth, endOfMonth } from 'date-fns';
import { ReportsClient } from '@/components/reports/reports-client';

export default async function ReportsPage() {
  const today = new Date();
  const initialInvoices = await getInvoices(startOfMonth(today), endOfMonth(today));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo tổng hợp"
        description="Xem báo cáo chi tiết và tổng hợp theo khoảng thời gian."
      />
      <ReportsClient initialInvoices={initialInvoices} />
    </div>
  );
}
