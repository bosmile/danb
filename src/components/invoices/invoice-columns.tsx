'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { InvoiceSerializable } from '@/types';
import { format } from 'date-fns';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
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
import { deleteInvoice } from '@/lib/actions/invoices';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { InvoiceDetailsModal } from './invoice-details-modal';

const CategoryBadge = ({ category }: { category: InvoiceSerializable['category'] }) => {
    const variant: "default" | "secondary" | "destructive" =
        category === 'BIGC' ? 'default' : category === 'SPLZD' ? 'secondary' : 'destructive';
    const text = category === 'OTHER' ? 'Khác' : category;

    return <Badge variant={variant}>{text}</Badge>
};

export const getInvoiceColumns = (onDataChanged: () => void): ColumnDef<InvoiceSerializable>[] => [
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Ngày
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => format(new Date(row.getValue('date')), 'dd/MM/yyyy'),
  },
  {
    accessorKey: 'category',
    header: 'Loại',
    cell: ({ row }) => <CategoryBadge category={row.getValue('category')} />,
  },
  {
    accessorKey: 'items',
    header: 'Sản phẩm',
    cell: ({ row }) => {
        const items = row.original.items || [];
        const invoice = row.original;
        if (items.length === 0) {
            return <span>-</span>;
        }
        if (items.length === 1) {
            return <span>{items[0].productName}</span>;
        }
        return (
            <InvoiceDetailsModal invoice={invoice}>
              <button className="cursor-pointer underline decoration-dotted text-left">
                  {items.length} sản phẩm
              </button>
            </InvoiceDetailsModal>
        )
    },
    filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        const items = row.original.items || [];
        return items.some(item => 
            item.productName.toLowerCase().includes((filterValue as string).toLowerCase())
        );
    }
  },
  {
    accessorKey: 'grandTotal',
    header: 'Tổng cộng',
    cell: ({ row }) => new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(row.getValue('grandTotal')),
  },
  {
    id: 'buyerAndPlace',
    header: 'Người mua - Nơi nhận',
    accessorFn: (row) => {
      const buyer = row.buyer;
      const items = row.items || [];
      const places = [...new Set(items.map(item => item.receivingPlace))];
      const placeText = places.length === 0 ? '' : places.length === 1 ? places[0] : 'Nhiều nơi';
      return `${buyer} - ${placeText}`;
    }
  },
  {
    accessorKey: 'buyer',
    header: 'Người mua',
  },
  {
    accessorKey: 'receivingPlace',
    header: 'Nơi nhận',
    cell: ({ row }) => {
        const items = row.original.items || [];
        const places = [...new Set(items.map(item => item.receivingPlace))];
        if (places.length === 0) return '-';
        if (places.length === 1) return places[0];
        return 'Nhiều nơi';
    }
  },
  {
    accessorKey: 'imageUrl',
    header: 'Ảnh',
    cell: ({ row }) => {
      const imageUrl = row.getValue('imageUrl') as string | undefined;
      return imageUrl ? (
        <Image
          src={imageUrl}
          alt="Thumbnail"
          width={40}
          height={40}
          className="rounded-md object-cover"
          data-ai-hint="receipt grocery"
        />
      ) : null;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const invoice = row.original;
      const { toast } = useToast();

      const handleDelete = async () => {
        const result = await deleteInvoice(invoice.id);
        if (result.success) {
            toast({ title: "Thành công", description: "Đã xóa hóa đơn." });
            onDataChanged();
        } else {
            toast({ variant: 'destructive', title: "Lỗi", description: result.error });
        }
      }

      return (
        <AlertDialog>
          <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                <Link href={`/invoices/${invoice.id}/edit`}>Sửa</Link>
              </DropdownMenuItem>
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
                      Hành động này không thể hoàn tác. Hóa đơn sẽ bị xóa vĩnh viễn.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  },
];
