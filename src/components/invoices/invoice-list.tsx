'use client';
import { InvoiceSerializable } from "@/types";
import { InvoiceCard } from "./invoice-card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteInvoice } from "@/lib/actions/invoices";
import { useState } from "react";

export function InvoiceList({ invoices, onDataChanged }: { invoices: InvoiceSerializable[]; onDataChanged: () => void }) {
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
    const { toast } = useToast();

    const handleDelete = async () => {
        if (!invoiceToDelete) return;
        const result = await deleteInvoice(invoiceToDelete);
        if (result.success) {
            toast({ title: "Thành công", description: "Đã xóa hóa đơn." });
            onDataChanged();
        } else {
            toast({ variant: 'destructive', title: "Lỗi", description: result.error });
        }
        setInvoiceToDelete(null);
    }
    
    return (
        <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
            <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">Giao dịch gần đây</h3>
                </div>
                {invoices.length > 0 ? invoices.map(invoice => (
                    <InvoiceCard key={invoice.id} invoice={invoice} onDelete={setInvoiceToDelete} />
                )) : (
                    <div className="text-center text-muted-foreground py-10">Không có kết quả.</div>
                )}
            </div>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Hành động này không thể hoàn tác. Hóa đơn sẽ bị xóa vĩnh viễn.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
