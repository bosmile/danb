'use client';

import { useState, useEffect, useMemo } from 'react';
import type { InvoiceSerializable } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { InvoiceFormModal } from '@/components/invoices/invoice-form-modal';
import { StatsCards } from './stats-cards';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { getInvoices } from '@/lib/actions/invoices';
import { InvoiceTable } from '../invoices/invoice-table';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

export function DashboardClient({ initialInvoices }: { initialInvoices: InvoiceSerializable[] }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refreshInvoices = async (newDate?: DateRange) => {
    const targetDate = newDate || date;
    setLoading(true);
    try {
      const freshInvoices = await getInvoices(targetDate?.from, targetDate?.to);
      setInvoices(freshInvoices);
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
  }, [date]);

  const onDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
  }

  const handleInvoiceUpdate = () => {
    refreshInvoices();
  };
  
  const stats = useMemo(() => {
    const totalSpend = invoices.reduce((acc, inv) => acc + inv.total, 0);
    const totalItems = invoices.reduce((acc, inv) => acc + inv.quantity, 0);
    return { totalSpend, totalItems };
  }, [invoices]);

  return (
    <div className="space-y-6">
      <PageHeader title="Trang chủ" description="Tổng quan về các hóa đơn chi tiêu.">
        <InvoiceFormModal onInvoiceAdded={handleInvoiceUpdate}>
          <span className="hidden sm:inline">Thêm hóa đơn</span>
        </InvoiceFormModal>
      </PageHeader>
      
      <div className="flex items-center justify-between">
        <StatsCards totalSpend={stats.totalSpend} totalItems={stats.totalItems} />
        <DateRangePicker date={date} setDate={onDateChange} />
      </div>

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
