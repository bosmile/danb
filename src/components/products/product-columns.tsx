'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ProductSerializable } from '@/types';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { ProductFormModal } from './product-form-modal';
import { deleteProduct } from '@/lib/actions/products'; 
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

const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export const getProductColumns = (onDataChanged: () => void): ColumnDef<ProductSerializable>[] => {
  const ActionCell = ({ row }: { row: any }) => {
    const product = row.original;
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <ProductFormModal productToEdit={product} onProductUpdated={onDataChanged}>
                <button className="w-full">
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Sửa</DropdownMenuItem>
                </button>
              </ProductFormModal>
              <DropdownMenuSeparator />
               <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  Xóa
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

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
  };

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Tên sản phẩm
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'totalQuantityPurchased',
      header: ({ column }) => (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="w-full justify-end -mr-4"
        >
            Tổng SL đã mua
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-right">{row.getValue('totalQuantityPurchased') || 0}</div>,
    },
    {
        accessorKey: 'totalAmountSpent',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="w-full justify-end -mr-4"
            >
                Tổng tiền đã mua
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="text-right">{currencyFormatter(row.getValue('totalAmountSpent') || 0)}</div>,
    },
    {
      id: 'actions',
      cell: ActionCell,
      header: () => <div className="text-center">Hành động</div>,
    },
  ];
};
