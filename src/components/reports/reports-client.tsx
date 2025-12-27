'use client';

import { useState, useEffect, useMemo } from 'react';
import type { InvoiceSerializable } from '@/types';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { getInvoices } from '@/lib/actions/invoices';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { ReportsView } from './reports-view';

export function ReportsClient() {
  const [invoices, setInvoices] = useState<InvoiceSerializable[]>([]);
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (date?.from && date?.to) {
      setLoading(true);
      getInvoices(date.from, date.to)
        .then(setInvoices)
        .catch(() => toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể tải báo cáo.',
        }))
        .finally(() => setLoading(false));
    }
  }, [date, toast]);

  const onDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
  }

  // We will pass all invoices to the view now
  const allInvoices = useMemo(() => invoices, [invoices]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DateRangePicker date={date} setDate={onDateChange} allowManualInput={true} />
      </div>
      
      {loading ? (
        <div className="space-y-8">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <ReportsView allInvoicesData={allInvoices} />
      )}
    </div>
  );
}
