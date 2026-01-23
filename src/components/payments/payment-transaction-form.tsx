'use client';

import { useState, useEffect } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { PaymentSerializable } from '@/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ManualDateInput } from '../shared/manual-date-input';
import { useToast } from '@/hooks/use-toast';
import { addTransactionToPayment, deleteTransaction } from '@/lib/actions/payments';
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

const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const transactionSchema = z.object({
    amount: z.coerce.number().min(1, 'Số tiền phải lớn hơn 0.'),
    date: z.date({ required_error: 'Vui lòng chọn ngày thanh toán.' }),
});
type TransactionFormData = z.infer<typeof transactionSchema>;


export function PaymentTransactionForm({ payment, onDataChanged }: { payment: PaymentSerializable; onDataChanged: () => void; }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const paidAmount = payment.transactions.reduce((acc, t) => acc + t.amount, 0);
    const remainingAmount = payment.totalAmount - paidAmount;

    const form = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            amount: 0,
            date: new Date(),
        }
    });

    useEffect(() => {
        form.reset({
             amount: remainingAmount > 0 ? remainingAmount : 0,
            date: new Date(),
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payment.id, remainingAmount]);


    const onSubmit = async (data: TransactionFormData) => {
        setIsSubmitting(true);
        try {
            const result = await addTransactionToPayment(payment.id, data);
            if (result.success) {
                toast({ title: 'Thành công', description: 'Đã thêm thanh toán.' });
                onDataChanged(); 
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Lỗi', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (transactionId: string) => {
        try {
            const result = await deleteTransaction(payment.id, transactionId);
            if (result.success) {
                toast({ title: 'Thành công', description: 'Đã xóa thanh toán.' });
                onDataChanged();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Lỗi', description: error.message });
        }
    };
    
    return (
        <div className="space-y-5">
            <div>
                <h4 className="text-xs font-bold text-muted-foreground mb-3">Thêm thanh toán mới</h4>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                         <div className="flex gap-2 items-start">
                             <div className="relative flex-1">
                                <FormLabel className="text-[10px] absolute -top-1.5 left-3 bg-muted/30 px-1 text-muted-foreground z-10">Ngày trả</FormLabel>
                                <FormField name="date" control={form.control} render={({ field }) => (
                                    <FormItem className="space-y-0">
                                        <FormControl>
                                            <ManualDateInput 
                                                date={field.value} 
                                                setDate={field.onChange} 
                                                placeholder="Nhập ngày (ddmmyy)" 
                                                className="[&_input]:bg-background"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs pt-1"/>
                                    </FormItem>
                                )} />
                            </div>
                            <div className="relative flex-1">
                                <FormLabel className="text-[10px] absolute -top-1.5 left-3 bg-muted/30 px-1 text-muted-foreground z-10">Số tiền</FormLabel>
                                <FormField name="amount" control={form.control} render={({ field }) => (
                                    <FormItem className="space-y-0">
                                        <FormControl><Input type="number" {...field} className="bg-background" /></FormControl>
                                        <FormMessage className="text-xs pt-1"/>
                                    </FormItem>
                                )} />
                            </div>
                            <Button type="submit" disabled={isSubmitting} size="icon" className="w-10 h-10 aspect-square shrink-0">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
            
            {(payment.transactions && payment.transactions.length > 0) && (
                 <div>
                    <h4 className="text-xs font-bold text-muted-foreground mb-2">Lịch sử thanh toán</h4>
                    <div className="bg-background rounded-xl overflow-hidden border border-border">
                        {payment.transactions.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3 border-b border-border last:border-0">
                                <div>
                                    <p className="text-sm font-medium">{format(new Date(t.date), 'dd/MM/yyyy')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold">{currencyFormatter(t.amount)}</p>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive h-7 w-7">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Xóa lần thanh toán?</AlertDialogTitle>
                                                <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
