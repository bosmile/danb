'use client';
import { useState, useEffect } from 'react';
import type { InvoiceSerializable, InvoiceCategory } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { ReportsView } from '@/components/reports/reports-view';
import { DatePicker } from '@/components/shared/date-picker';
import { getInvoices } from '@/lib/actions/invoices';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CategoryFilter = InvoiceCategory | 'ALL';

export default function ReportsPage() {
    const [invoices, setInvoices] = useState<InvoiceSerializable[]>([]);
    const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
    const [category, setCategory] = useState<CategoryFilter>('ALL');
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    
    useEffect(() => {
        if (startDate && endDate) {
            setLoading(true);
            // We fetch all invoices for the date range and then filter by category on the client.
            // This is simpler than modifying the server action for now.
            getInvoices(startDate, endDate)
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
    }, [startDate, endDate, category, toast]);

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
            <div className="flex items-center gap-2">
                <DatePicker date={startDate} setDate={setStartDate} placeholder="Từ ngày" />
                <DatePicker date={endDate} setDate={setEndDate} placeholder="Đến ngày" />
            </div>
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
