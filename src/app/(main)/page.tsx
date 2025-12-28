'use client';

import { useState, useEffect, useMemo } from 'react';
import type { InvoiceSerializable } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { getInvoices } from '@/lib/actions/invoices';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<InvoiceSerializable[]>([]);
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refreshInvoices = async (newDate?: DateRange) => {
    const targetDate = newDate || date;
    setLoading(true);
    try {
      if (targetDate?.from && targetDate?.to) {
        const freshInvoices = await getInvoices(targetDate.from, targetDate.to);
        setInvoices(freshInvoices);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách hóa đơn.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (date?.from && date?.to) {
      refreshInvoices(date);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);


  const onDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
  }

  const handleInvoiceUpdate = () => {
    refreshInvoices();
  };
  
  const stats = useMemo(() => {
    const totalSpend = invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const totalItems = invoices.reduce((acc, inv) => {
        const items = inv.items || [];
        return acc + items.reduce((itemAcc, item) => itemAcc + (item.quantity || 0), 0);
    }, 0);
    return { totalSpend, totalItems };
  }, [invoices]);

  return (
    <div className="space-y-6">
      <PageHeader title="Trang chủ" description="Tổng quan về các hóa đơn chi tiêu.">
        <div className="flex items-center gap-2">
            <DateRangePicker date={date} setDate={onDateChange} className="w-full md:w-auto" allowManualInput={true} />
            <Button asChild>
                <Link href="/invoices/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Thêm hóa đơn</span>
                    <span className="sm:hidden">Thêm</span>
                </Link>
            </Button>
        </div>
      </PageHeader>
      
      <StatsCards totalSpend={stats.totalSpend} totalItems={stats.totalItems} />

      {loading ? (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <InvoiceTable data={invoices} onDataChanged={handleInvoiceUpdate} />
      )}
    </div>
  );
}
