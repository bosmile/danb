'use client';

import { useEffect, useState } from 'react';
import { InvoiceFormWrapper } from '@/components/invoices/invoice-form-wrapper';
import { PageHeader } from '@/components/shared/page-header';
import { getInvoiceById } from '@/lib/actions/invoices';
import { InvoiceSerializable } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const [invoiceToEdit, setInvoiceToEdit] = useState<InvoiceSerializable | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    async function fetchInvoice() {
      setLoading(true);
      try {
        const invoice = await getInvoiceById(params.id);
        if (invoice) {
          setInvoiceToEdit(invoice);
        } else {
          toast({ variant: 'destructive', title: 'Lỗi', description: 'Không tìm thấy hóa đơn.' });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tải dữ liệu hóa đơn.' });
      } finally {
        setLoading(false);
      }
    }
    
    fetchInvoice();

  }, [params.id, toast]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sửa hóa đơn"
        description="Cập nhật thông tin chi tiết cho hóa đơn."
      />
      <InvoiceFormWrapper invoiceToEdit={invoiceToEdit} loading={loading} />
    </div>
  );
}
