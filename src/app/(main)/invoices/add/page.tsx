import { InvoiceFormWrapper } from '@/components/invoices/invoice-form-wrapper';
import { PageHeader } from '@/components/shared/page-header';

export default function AddInvoicePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Thêm hóa đơn mới"
        description="Điền thông tin chi tiết để thêm hóa đơn mới."
      />
      <InvoiceFormWrapper />
    </div>
  );
}
