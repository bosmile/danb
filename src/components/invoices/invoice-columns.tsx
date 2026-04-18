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
import { Edit2, Trash2 } from 'lucide-react';

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
        if (items.length === 0) {
            return <span>-</span>;
        }
        if (items.length === 1) {
            return <span>{items[0].productName}</span>;
        }
        return (
            <span className="font-medium text-primary">
                {items.length} sản phẩm
            </span>
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

      const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) return;
        
        const result = await deleteInvoice(invoice.id);
        if (result.success) {
            toast({ title: "Thành công", description: "Đã xóa hóa đơn." });
            onDataChanged();
        } else {
            toast({ variant: 'destructive', title: "Lỗi", description: result.error });
        }
      }

      return (
        <div className="flex items-center gap-1">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-500 hover:text-blue-600" 
                asChild
                onClick={(e) => e.stopPropagation()}
            >
                <Link href={`/invoices/${invoice.id}/edit`}>
                    <Edit2 className="h-4 w-4" />
                </Link>
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-500 hover:text-destructive" 
                onClick={handleDelete}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      );
    },
  },
];
