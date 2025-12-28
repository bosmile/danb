'use client';

import { useEffect, useState } from 'react';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import { PageHeader } from '@/components/shared/page-header';
import { getInvoiceById } from '@/lib/actions/invoices';
import type { InvoiceSerializable } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const [invoiceToEdit, setInvoiceToEdit] = useState<InvoiceSerializable | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const { id } = params;
    async function fetchInvoice() {
      setLoading(true);
      try {
        const invoice = await getInvoiceById(id);
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
    
    if (id) {
        fetchInvoice();
    }

  }, [params, toast]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sửa hóa đơn"
        description="Cập nhật thông tin chi tiết cho hóa đơn."
      />
      <Card>
        <CardContent className="pt-6">
            <InvoiceForm invoiceToEdit={invoiceToEdit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
