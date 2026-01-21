'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ManualDateInput } from '@/components/shared/manual-date-input';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getPayments, createPaymentForPeriod } from '@/lib/actions/payments';
import type { PaymentSerializable } from '@/types';
import { PaymentsTable } from '@/components/payments/payments-table';

export default function PaymentsPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [payments, setPayments] = useState<PaymentSerializable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
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

  const handleCreatePayment = async () => {
    if (!startDate || !endDate) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng chọn ngày bắt đầu và kết thúc.' });
      return;
    }
    setIsCreating(true);
    try {
      const result = await createPaymentForPeriod(startDate, endDate);
      if (result.success) {
        toast({ title: 'Thành công', description: 'Đã lưu kỳ thanh toán mới.' });
        await refreshPayments();
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

    </div>
  );
}
