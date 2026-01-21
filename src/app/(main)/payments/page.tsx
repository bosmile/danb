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
  }, []);

  const summaryStats = useMemo(() => {
    if (!payments || payments.length === 0) {
      return { totalDebt: 0, totalPaid: 0, remaining: 0, lastPaidDate: null };
    }

    const totalDebt = payments.reduce((acc, p) => acc + p.totalAmount, 0);
    
    const paidPayments = payments.filter(p => p.isPaid);
    const totalPaid = paidPayments.reduce((acc, p) => acc + p.totalAmount, 0);
    
    const remaining = totalDebt - totalPaid;
    
    const lastPaidPayment = paidPayments
        .filter(p => p.paidAt) // ensure paidAt exists
        .sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime())[0];
    
    const lastPaidDate = lastPaidPayment ? new Date(lastPaidPayment.paidAt!) : null;

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
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Lỗi', description: error.message || 'Không thể lưu kỳ thanh toán.' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý thanh toán"
        description="Lưu và theo dõi các kỳ thanh toán."
      />

      <Card>
        <CardHeader>
          <CardTitle>Tình hình công nợ</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm text-muted-foreground">Tổng nợ</span>
            <span className="text-2xl font-bold">{currencyFormatter(summaryStats.totalDebt)}</span>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm text-muted-foreground">Đã thanh toán</span>
            <span className="text-2xl font-bold">{currencyFormatter(summaryStats.totalPaid)}</span>
             {summaryStats.lastPaidDate && (
                <p className="text-xs text-muted-foreground">
                    Thanh toán gần nhất: {format(summaryStats.lastPaidDate, 'dd/MM/yyyy')}
                </p>
            )}
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-bold text-primary">Còn lại</span>
            <span className="text-2xl font-bold text-primary">{currencyFormatter(summaryStats.remaining)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tạo kỳ thanh toán mới</CardTitle>
          <CardDescription>Chọn khoảng thời gian để tạo một kỳ thanh toán và lưu lại dữ liệu báo cáo tương ứng.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="grid grid-cols-2 gap-4 w-full sm:w-auto">
             <ManualDateInput date={startDate} setDate={setStartDate} placeholder="Từ ngày" />
             <ManualDateInput date={endDate} setDate={setEndDate} placeholder="Đến ngày" />
          </div>
          <Button onClick={handleCreatePayment} disabled={isCreating || !startDate || !endDate}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu kỳ thanh toán
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Lịch sử thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <p>Đang tải...</p>
            ) : (
                <PaymentsTable data={payments} onDataChanged={refreshPayments} />
            )}
        </CardContent>
      </Card>

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
