'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ManualDateInput } from '@/components/shared/manual-date-input';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getPayments, createPaymentForPeriod } from '@/lib/actions/payments';
import type { PaymentSerializable } from '@/types';
import { PaymentsTable } from '@/components/payments/payments-table';
import { PaymentReportModal } from '@/components/payments/payment-report-modal';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentsList } from '@/components/payments/payments-list';

const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export default function PaymentsPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [payments, setPayments] = useState<PaymentSerializable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedPayment, setNewlyCreatedPayment] = useState<PaymentSerializable | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const refreshPayments = async () => {
    setIsLoading(true);
    try {
      const data = await getPayments();
      setPayments(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tải danh sách kỳ thanh toán.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaryStats = useMemo(() => {
    if (!payments || payments.length === 0) {
      return { totalDebt: 0, totalPaid: 0, remaining: 0, lastPaidDate: null };
    }

    const totalDebt = payments.reduce((acc, p) => acc + p.totalAmount, 0);

    const allTransactions = payments.flatMap(p => p.transactions || []);
    const totalPaid = allTransactions.reduce((acc, t) => acc + t.amount, 0);
    
    const remaining = totalDebt - totalPaid;
    
    const lastPaidTransaction = allTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const lastPaidDate = lastPaidTransaction ? new Date(lastPaidTransaction.date) : null;

    return { totalDebt, totalPaid, remaining, lastPaidDate };
  }, [payments]);

  const handleCreatePayment = async () => {
    if (!startDate || !endDate) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng chọn ngày bắt đầu và kết thúc.' });
      return;
    }
    setIsCreating(true);
    try {
      const result = await createPaymentForPeriod(startDate, endDate);
      if (result.success && result.newPayment) {
        toast({ title: 'Thành công', description: 'Đã lưu kỳ thanh toán mới.' });
        await refreshPayments();
        setNewlyCreatedPayment(result.newPayment);
      } else {
        throw new Error(result.error || 'Không thể tạo kỳ thanh toán');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Lỗi', description: error.message || 'Không thể lưu kỳ thanh toán.' });
    } finally {
      setIsCreating(false);
    }
  };

  if (isMobile === undefined) {
    return (
        <div className="space-y-6">
            <PageHeader title="Quản lý thanh toán" description="Lưu và theo dõi các kỳ thanh toán." />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-60 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Quản lý thanh toán"
        description="Lưu và theo dõi các kỳ thanh toán."
      />

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tình hình công nợ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 overflow-visible">
            <div className="space-y-1.5 rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">Tổng nợ</p>
                <p className="text-lg font-bold">{currencyFormatter(summaryStats.totalDebt)}</p>
            </div>
            <div className="space-y-1.5 rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">Đã thanh toán</p>
                <p className="text-lg font-bold">{currencyFormatter(summaryStats.totalPaid)}</p>
                {summaryStats.lastPaidDate && !isNaN(summaryStats.lastPaidDate.getTime()) && (
                    <p className="text-[10px] text-muted-foreground pt-1">
                        Gần nhất: {format(summaryStats.lastPaidDate, 'dd/MM/yy')}
                    </p>
                )}
            </div>
            <div className="space-y-1.5 rounded-2xl border border-primary/40 bg-card p-4 shadow-sm sm:col-span-2 md:col-span-1">
                <p className="text-xs text-muted-foreground">Còn lại</p>
                <p className="text-lg font-bold text-primary">{currencyFormatter(summaryStats.remaining)}</p>
            </div>
        </div>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Tạo kỳ thanh toán mới</CardTitle>
          <CardDescription>Chọn khoảng thời gian để tạo một kỳ thanh toán và lưu lại dữ liệu báo cáo tương ứng.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:w-auto">
             <ManualDateInput date={startDate} setDate={setStartDate} placeholder="Từ ngày" />
             <ManualDateInput date={endDate} setDate={setEndDate} placeholder="Đến ngày" />
          </div>
          <Button onClick={handleCreatePayment} disabled={isCreating || !startDate || !endDate} className="w-full sm:w-auto">
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu kỳ thanh toán
          </Button>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Lịch sử thanh toán</h2>
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
        ) : isMobile ? (
            <PaymentsList data={payments} onDataChanged={refreshPayments} />
        ) : (
            <Card>
                <CardContent className="p-0">
                    <PaymentsTable data={payments} onDataChanged={refreshPayments} />
                </CardContent>
            </Card>
        )}
      </div>
      

      {newlyCreatedPayment && (
        <PaymentReportModal 
            payment={newlyCreatedPayment}
            open={!!newlyCreatedPayment}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setNewlyCreatedPayment(null);
                }
            }}
        />
      )}
    </div>
  );
}
