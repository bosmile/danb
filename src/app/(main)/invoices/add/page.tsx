import { InvoiceForm } from '@/components/invoices/invoice-form';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';

export default function AddInvoicePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Thêm hóa đơn mới"
        description="Điền thông tin chi tiết để thêm hóa đơn mới."
      />
      <Card>
        <CardContent className="pt-6">
            <InvoiceForm />
        </CardContent>
      </Card>
    </div>
  );
}
