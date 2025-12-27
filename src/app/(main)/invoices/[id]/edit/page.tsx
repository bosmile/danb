import { InvoiceFormWrapper } from '@/components/invoices/invoice-form-wrapper';
import { PageHeader } from '@/components/shared/page-header';
import { getInvoices } from '@/lib/actions/invoices'; // We'll use this to fetch a single invoice

export const revalidate = 0;

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  // In a real app, you'd have a getInvoiceById function.
  // For now, we'll fetch all and find the one.
  const allInvoices = await getInvoices();
  const invoiceToEdit = allInvoices.find(inv => inv.id === params.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sửa hóa đơn"
        description="Cập nhật thông tin chi tiết cho hóa đơn."
      />
      <InvoiceFormWrapper invoiceToEdit={invoiceToEdit} />
    </div>
  );
}
