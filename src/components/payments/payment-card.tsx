'use client';

import type { PaymentSerializable } from '@/types';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PaymentTransactionForm } from './payment-transaction-form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deletePayment } from '@/lib/actions/payments';
import { PaymentReportModal } from './payment-report-modal';

const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const getPaymentStatus = (paidAmount: number, totalAmount: number): { text: string, color: string, progressColor: string } => {
    if (paidAmount <= 0) {
        return { text: 'Chưa thanh toán', color: 'text-destructive', progressColor: 'bg-destructive' };
    }
    if (paidAmount >= totalAmount) {
        return { text: 'Đã hoàn tất', color: 'text-green-600', progressColor: 'bg-green-500' };
    }
    return { text: 'Thanh toán một phần', color: 'text-yellow-600', progressColor: 'bg-primary' };
};

export function PaymentCard({ payment, onDataChanged }: { payment: PaymentSerializable; onDataChanged: () => void }) {
    const { toast } = useToast();
    const paidAmount = payment.transactions.reduce((acc, t) => acc + t.amount, 0);
    const remainingAmount = payment.totalAmount - paidAmount;
    const progress = payment.totalAmount > 0 ? (paidAmount / payment.totalAmount) * 100 : 0;
    const status = getPaymentStatus(paidAmount, payment.totalAmount);
    
    const handleDelete = async () => {
        const result = await deletePayment(payment.id);
        if (result.success) {
            toast({ title: "Thành công", description: "Đã xóa kỳ thanh toán." });
            onDataChanged();
        } else {
            toast({ variant: 'destructive', title: "Lỗi", description: result.error });
        }
    };

    return (
        <AlertDialog>
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Kỳ thanh toán</p>
                            <h3 className="font-bold text-base">{`${format(new Date(payment.startDate), 'dd/MM/yy')} - ${format(new Date(payment.endDate), 'dd/MM/yy')}`}</h3>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground">
                                    <span className="sr-only">Mở menu</span>
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                                <PaymentReportModal payment={payment}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer">
                                        <Eye className="h-4 w-4"/> Xem báo cáo
                                    </DropdownMenuItem>
                                </PaymentReportModal>
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Xóa
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-[10px] text-muted-foreground">Tổng tiền</p>
                            <p className="font-semibold text-sm">{currencyFormatter(payment.totalAmount)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Còn lại</p>
                            <p className={`font-semibold text-sm ${remainingAmount > 0 ? 'text-primary' : 'text-green-600'}`}>{currencyFormatter(remainingAmount)}</p>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className={`${status.color} font-medium`}>{status.text}</span>
                            <span className="text-muted-foreground">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" indicatorClassName={status.progressColor} />
                    </div>
                </div>

                <div className="bg-muted/30 p-4 border-t border-border">
                    <PaymentTransactionForm payment={payment} onDataChanged={onDataChanged} />
                </div>
            </div>
            
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Hành động này không thể hoàn tác. Kỳ thanh toán sẽ bị xóa vĩnh viễn.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
