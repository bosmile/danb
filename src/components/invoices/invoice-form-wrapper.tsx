'use client';

import { Card, CardContent } from '@/components/ui/card';
import { InvoiceForm } from './invoice-form';
import type { InvoiceSerializable } from '@/types';
import { Skeleton } from '../ui/skeleton';

interface InvoiceFormWrapperProps {
  invoiceToEdit?: InvoiceSerializable;
  loading?: boolean;
}

export function InvoiceFormWrapper({ invoiceToEdit, loading }: InvoiceFormWrapperProps) {
  if (loading) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <div className="sm:col-span-2">
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <div className="sm:col-span-2">
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        <InvoiceForm invoiceToEdit={invoiceToEdit} />
      </CardContent>
    </Card>
  );
}
