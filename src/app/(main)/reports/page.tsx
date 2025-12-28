'use client';
import { useState, useEffect } from 'react';
import type { InvoiceSerializable, InvoiceCategory } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { ReportsView } from '@/components/reports/reports-view';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { getInvoices } from '@/lib/actions/invoices';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CategoryFilter = InvoiceCategory | 'ALL';

export default function ReportsPage() {
    const [invoices, setInvoices] = useState<InvoiceSerializable[]>([]);
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [category, setCategory] = useState<CategoryFilter>('ALL');
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    
    useEffect(() => {
        if (date?.from && date?.to) {
            setLoading(true);
            // We fetch all invoices for the date range and then filter by category on the client.
            // This is simpler than modifying the server action for now.
            getInvoices(date.from, date.to)
                .then(allInvoices => {
                    if (category === 'ALL') {
                        setInvoices(allInvoices);
                    } else {
                        setInvoices(allInvoices.filter(inv => inv.category === category));
                    }
                })
                .catch(() => toast({
                    variant: 'destructive',
                    title: 'Lỗi',
                    description: 'Không thể tải báo cáo.',
                }))
                .finally(() => setLoading(false));
        }
    }, [date, category, toast]);

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
        <div className="flex flex-col sm:flex-row gap-2">
            <Select value={category} onValueChange={(value: CategoryFilter) => setCategory(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Lọc theo loại" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Tất cả loại</SelectItem>
                    <SelectItem value="BIGC">BIGC</SelectItem>
                    <SelectItem value="SPLZD">SPLZD</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                </SelectContent>
            </Select>
            <DateRangePicker date={date} setDate={onDateChange} allowManualInputOnly={true} />
        </div>
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
