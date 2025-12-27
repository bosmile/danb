'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ProductSerializable } from '@/types';
import { format } from 'date-fns';
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

export const getProductColumns = (onDataChanged: () => void): ColumnDef<ProductSerializable>[] => {
  const ActionCell = ({ row }: { row: any }) => {
    const product = row.original;
    const { toast } = useToast();

    const handleDelete = async () => {
      try {
        await deleteProduct(product.id);
        toast({ title: "Thành công", description: "Đã xóa sản phẩm." });
        onDataChanged();
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
        >
          Tên sản phẩm
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="pl-4">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ row }) => format(new Date(row.getValue('createdAt')), 'dd/MM/yyyy'),
    },
    {
      id: 'actions',
      cell: ActionCell,
    },
  ];
};