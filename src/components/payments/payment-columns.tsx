'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { PaymentSerializable } from '@/types';
import { format } from 'date-fns';
import { ArrowUpDown, MoreHorizontal, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { updatePaymentStatus, deletePayment } from '@/lib/actions/payments';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PaymentReportModal } from './payment-report-modal';

const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export const getPaymentColumns = (onDataChanged: () => void): ColumnDef<PaymentSerializable>[] => [
  {
    id: 'period',
    header: 'Kỳ thanh toán',
    cell: ({ row }) => {
        const startDate = row.original.startDate;
        const endDate = row.original.endDate;
        return `${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`;
    }
  },
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Tổng tiền
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => currencyFormatter(row.getValue('totalAmount')),
  },
  {
    accessorKey: 'createdAt',
    header: 'Ngày tạo',
    cell: ({ row }) => format(new Date(row.getValue('createdAt')), 'dd/MM/yyyy'),
  },
  {
    accessorKey: 'isPaid',
    header: 'Đã thanh toán',
    cell: ({ row }) => {
        const payment = row.original;
        const { toast } = useToast();
        
        const handleCheckedChange = async (checked: boolean) => {
            const result = await updatePaymentStatus(payment.id, checked);
            if (result.success) {
                toast({ title: 'Thành công', description: 'Đã cập nhật trạng thái thanh toán.' });
                onDataChanged();
            } else {
                toast({ variant: 'destructive', title: 'Lỗi', description: result.error });
            }
        };

        return (
            <Checkbox
                checked={payment.isPaid}
                onCheckedChange={handleCheckedChange}
                aria-label="Đã thanh toán"
            />
        )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const payment = row.original;
      const { toast } = useToast();

      const handleDelete = async () => {
        const result = await deletePayment(payment.id);
        if (result.success) {
            toast({ title: "Thành công", description: "Đã xóa kỳ thanh toán." });
            onDataChanged();
        } else {
            toast({ variant: 'destructive', title: "Lỗi", description: result.error });
        }
      }

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
              <PaymentReportModal payment={payment}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer">
                    <Eye className="h-4 w-4"/> Xem báo cáo
                </DropdownMenuItem>
              </PaymentReportModal>
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
    },
  },
];
