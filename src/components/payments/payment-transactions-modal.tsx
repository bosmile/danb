'use client';

import { useState, useEffect } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { PaymentSerializable, PaymentTransactionSerializable } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ManualDateInput } from '../shared/manual-date-input';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addTransactionToPayment, deleteTransaction } from '@/lib/actions/payments';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
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
    note: z.string().optional(),
});
type TransactionFormData = z.infer<typeof transactionSchema>;


export function PaymentTransactionsModal({ children, payment, onDataChanged }: { children: React.ReactNode; payment: PaymentSerializable; onDataChanged: () => void; }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            amount: 0,
            date: undefined,
            note: '',
        }
    });

    useEffect(() => {
        if (open) {
            const paidAmount = payment.transactions.reduce((acc, t) => acc + t.amount, 0);
            const remainingAmount = payment.totalAmount - paidAmount;
            form.reset({
                amount: remainingAmount > 0 ? remainingAmount : 0,
                date: undefined,
                note: ''
            });
        }
    }, [open, payment, form]);

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
                setOpen(false);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Lỗi', description: error.message });
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
    }
    
    const paidAmount = payment.transactions.reduce((acc, t) => acc + t.amount, 0);
    const remainingAmount = payment.totalAmount - paidAmount;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Quản lý thanh toán</DialogTitle>
                    <DialogDescription>
                        Kỳ thanh toán: {format(new Date(payment.startDate), 'dd/MM/yyyy')} - {format(new Date(payment.endDate), 'dd/MM/yyyy')}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-3 gap-4 text-center my-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Tổng công nợ</p>
                        <p className="text-xl font-bold">{currencyFormatter(payment.totalAmount)}</p>
                    </div>
                     <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Đã thanh toán</p>
                        <p className="text-xl font-bold">{currencyFormatter(paidAmount)}</p>
                    </div>
                     <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm text-primary">Còn lại</p>
                        <p className="text-xl font-bold text-primary">{currencyFormatter(remainingAmount)}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold">Thêm thanh toán mới</h3>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                            <FormField name="date" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ngày trả</FormLabel>
                                    <FormControl><ManualDateInput date={field.value} setDate={field.onChange} placeholder="Nhập ngày (ddmmyy)" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField name="amount" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Số tiền</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField name="note" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú</FormLabel>
                                    <FormControl><Textarea {...field} rows={1} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="sm:col-span-3 text-right">
                                 <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Plus className="mr-2 h-4 w-4" /> Thêm
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
                
                <div className="space-y-4">
                    <h3 className="font-semibold">Lịch sử thanh toán</h3>
                    <div className="border rounded-md max-h-60 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ngày</TableHead>
                                    <TableHead className="text-right">Số tiền</TableHead>
                                    <TableHead>Ghi chú</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payment.transactions.length > 0 ? (
                                    payment.transactions.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell>{format(new Date(t.date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="text-right">{currencyFormatter(t.amount)}</TableCell>
                                            <TableCell>{t.note}</TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
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
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">Chưa có thanh toán nào.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Đóng</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
