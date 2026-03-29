'use client';

import { useState, useEffect, useMemo } from 'react';
import type { InvoiceSerializable } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { getInvoices } from '@/lib/actions/invoices';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, PlusCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { ManualDateInput } from '@/components/shared/manual-date-input';
import { useIsMobile } from '@/hooks/use-mobile';
import { InvoiceList } from '@/components/invoices/invoice-list';
import { Input } from '@/components/ui/input';


export default function DashboardPage() {
  const [invoices, setInvoices] = useState<InvoiceSerializable[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceSerializable[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const isMobile = useIsMobile();

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

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = invoices.filter(invoice => 
      invoice.items.some(item => 
        item.productName.toLowerCase().includes(lowercasedFilter)
      )
    );
    setFilteredInvoices(filteredData);
  }, [searchTerm, invoices]);


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
        <div className="hidden items-center gap-2 md:flex">
            <div className="flex items-center gap-2">
              <ManualDateInput date={startDate} setDate={setStartDate} placeholder="Từ ngày" />
              <ManualDateInput date={endDate} setDate={setEndDate} placeholder="Đến ngày" />
            </div>
            <Button asChild>
                <Link href="/invoices/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Thêm hóa đơn
                </Link>
            </Button>
        </div>
      </PageHeader>
        <Button asChild className="md:hidden bg-primary hover:bg-orange-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 fixed bottom-28 right-4 z-30">
            <Link href="/invoices/add">
                <Plus className="h-6 w-6" />
                <span className="sr-only">Thêm hóa đơn</span>
            </Link>
        </Button>
      
      <section className="grid grid-cols-2 gap-3">
        <StatsCards totalSpend={stats.totalSpend} totalItems={stats.totalItems} />
      </section>

      <section className="flex flex-col gap-4 md:hidden">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input 
                className="w-full pl-10 pr-4 py-3 bg-card border-none rounded-xl shadow-sm ring-1 ring-border focus:ring-2 focus:ring-primary text-sm transition-all outline-none" 
                placeholder="Lọc theo sản phẩm..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-3">
            <ManualDateInput date={startDate} setDate={setStartDate} placeholder="Từ ngày" className="flex-1 [&_input]:rounded-xl [&_input]:ring-1 [&_input]:ring-border [&_input]:shadow-sm [&_input]:border-none"/>
            <ManualDateInput date={endDate} setDate={setEndDate} placeholder="Đến ngày" className="flex-1 [&_input]:rounded-xl [&_input]:ring-1 [&_input]:ring-border [&_input]:shadow-sm [&_input]:border-none"/>
        </div>
      </section>

      {loading ? (
        <div className="space-y-2 pt-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : (
        <>
            <div className="hidden md:block">
                <InvoiceTable data={invoices} onDataChanged={handleInvoiceUpdate} />
            </div>
            <div className="md:hidden">
                <InvoiceList invoices={filteredInvoices} onDataChanged={handleInvoiceUpdate} />
                <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600 font-medium uppercase tracking-widest">
                    Hiển thị {filteredInvoices.length} hóa đơn
                </div>
            </div>
        </>
      )}
    </div>
  );
}
