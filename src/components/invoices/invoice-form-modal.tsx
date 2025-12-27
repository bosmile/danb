'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InvoiceForm } from './invoice-form';
import type { InvoiceSerializable } from '@/types';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';

type InvoiceFormModalProps = {
  invoiceToEdit?: InvoiceSerializable;
  onInvoiceAdded: () => void;
  children?: React.ReactNode;
};

export function InvoiceFormModal({ invoiceToEdit, onInvoiceAdded, children }: InvoiceFormModalProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    onInvoiceAdded();
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm hóa đơn
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{invoiceToEdit ? 'Sửa hóa đơn' : 'Thêm hóa đơn mới'}</DialogTitle>
          <DialogDescription>
            {invoiceToEdit ? 'Cập nhật thông tin chi tiết cho hóa đơn.' : 'Điền thông tin chi tiết để thêm hóa đơn mới.'}
          </DialogDescription>
        </DialogHeader>
        <InvoiceForm invoiceToEdit={invoiceToEdit} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
