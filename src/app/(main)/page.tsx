'use client';

import { useState, useEffect, useMemo } from 'react';
import type { InvoiceSerializable } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { DatePicker } from '@/components/shared/date-picker';
import { getInvoices } from '@/lib/actions/invoices';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<InvoiceSerializable[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refreshInvoices = async (start?: Date, end?: Date) => {
    setLoading(true);
    try {
      if (start && end) {
        const freshInvoices = await getInvoices(start, end);
        setInvoices(freshInvoices);
      } else {
        setInvoices([]);
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
    refreshInvoices(startDate, endDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const handleInvoiceUpdate = () => {
    refreshInvoices(startDate, endDate);
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
            <div className="flex items-center gap-2">
              <DatePicker date={startDate} setDate={setStartDate} placeholder="Từ ngày" />
              <DatePicker date={endDate} setDate={setEndDate} placeholder="Đến ngày" />
            </div>
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
