'use client';
import { useState, useEffect } from 'react';
import type { InvoiceSerializable } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { ReportsView } from '@/components/reports/reports-view';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { getInvoices } from '@/lib/actions/invoices';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


export default function ReportsPage() {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo tổng hợp"
        description="Xem báo cáo chi tiết và tổng hợp theo khoảng thời gian."
        className="print-hidden"
      >
        <DateRangePicker date={date} setDate={onDateChange} allowManualInput={true} />
      </PageHeader>
      
      {loading ? (
        <div className="space-y-8">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <ReportsView allInvoicesData={invoices} />
      )}
    </div>
  );
}
