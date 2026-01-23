
'use client';
import type { ProductSerializable } from '@/types';
import { MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { ProductFormModal } from './product-form-modal';
import { deleteProduct } from '@/lib/actions/products';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
}

export function ProductCard({ product, onDataChanged }: { product: ProductSerializable; onDataChanged: () => void }) {
    const { toast } = useToast();

    const handleDelete = async () => {
        try {
            const result = await deleteProduct(product.id);
            if (result.success) {
                toast({ title: "Thành công", description: "Đã xóa sản phẩm." });
                onDataChanged();
            } else {
                 toast({ variant: 'destructive', title: "Lỗi", description: result.error });
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Lỗi", description: error.message || "Không thể xóa sản phẩm." });
        }
    };

    return (
        <AlertDialog>
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-card-foreground">{product.name}</h3>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-6 w-6 p-0 text-slate-400">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <ProductFormModal productToEdit={product} onProductUpdated={onDataChanged}>
                                <button className="w-full">
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Sửa</DropdownMenuItem>
                                </button>
                            </ProductFormModal>
                             <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                Xóa
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">SL đã mua</span>
                        <span className="text-foreground font-medium">{product.totalQuantityPurchased || 0}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Tổng tiền</span>
                        <span className="text-primary font-bold">{currencyFormatter(product.totalAmountSpent || 0)}</span>
                    </div>
                </div>
            </div>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Hành động này không thể hoàn tác. Sản phẩm sẽ bị xóa vĩnh viễn.
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
