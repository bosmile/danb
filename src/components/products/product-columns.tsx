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
} from '@/components/ui/dropdown-menu';
import { ProductFormModal } from './product-form-modal';
// Assume deleteProduct action exists
// import { deleteProduct } from '@/lib/actions/products'; 

export const getProductColumns = (onDataChanged: () => void): ColumnDef<ProductSerializable>[] => [
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
  },
  {
    accessorKey: 'createdAt',
    header: 'Ngày tạo',
    cell: ({ row }) => format(new Date(row.getValue('createdAt')), 'dd/MM/yyyy'),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const product = row.original;
      
      const handleDelete = async () => {
        // await deleteProduct(product.id);
        alert(`Deleting ${product.name}`);
        onDataChanged();
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <ProductFormModal productToEdit={product} onProductAdded={onDataChanged}>
              <button className="w-full">
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Sửa</DropdownMenuItem>
              </button>
            </ProductFormModal>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
