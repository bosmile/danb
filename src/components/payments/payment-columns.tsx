'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { PaymentSerializable } from '@/types';
import { format } from 'date-fns';
import { ArrowUpDown, MoreHorizontal, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { deletePayment } from '@/lib/actions/payments';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PaymentReportModal } from './payment-report-modal';
import { Progress } from '../ui/progress';

const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

const getPaymentStatus = (paidAmount: number, totalAmount: number): { text: string, color: string } => {
    if (paidAmount <= 0) {
        return { text: 'Chưa thanh toán', color: 'text-destructive' };
    }
    if (paidAmount >= totalAmount) {
        return { text: 'Đã hoàn tất', color: 'text-green-600' };
    }
    return { text: 'Thanh toán một phần', color: 'text-yellow-600' };
};

export const getPaymentColumns = (onDataChanged: () => void): ColumnDef<PaymentSerializable>[] => [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={row.getToggleExpandedHandler()}
          className="h-8 w-8"
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle row</span>
        </Button>
      );
    },
  },
  {
    accessorKey: 'endDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Kỳ thanh toán
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
        const startDate = row.original.startDate;
        const endDate = row.original.endDate;
        return `${format(new Date(startDate), 'dd/MM/yy')} - ${format(new Date(endDate), 'dd/MM/yy')}`;
    },
    sortingFn: 'datetime'
  },
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="justify-end w-full"
      >
        Tổng tiền
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-right">{currencyFormatter(row.getValue('totalAmount'))}</div>,
  },
  {
    accessorKey: 'paidAmount',
    header: ({ column }) => (
        <Button variant="ghost" className="justify-end w-full">Đã thanh toán</Button>
    ),
    cell: ({ row }) => {
        const paidAmount = row.original.transactions.reduce((acc, t) => acc + t.amount, 0);
        const transactions = row.original.transactions || [];
        return (
            <div className="text-right">
                <div>{currencyFormatter(paidAmount)}</div>
                {transactions.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                        {transactions.map(t => (
                            <div key={t.id}>{format(new Date(t.date), 'dd/MM/yy')}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
  },
   {
    accessorKey: 'remainingAmount',
    header: ({ column }) => (
        <Button variant="ghost" className="justify-end w-full">Còn lại</Button>
    ),
    cell: ({ row }) => {
        const paidAmount = row.original.transactions.reduce((acc, t) => acc + t.amount, 0);
        const remainingAmount = row.original.totalAmount - paidAmount;
        return <div className="text-right font-semibold text-primary">{currencyFormatter(remainingAmount)}</div>;
    }
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => {
        const paidAmount = row.original.transactions.reduce((acc, t) => acc + t.amount, 0);
        const totalAmount = row.original.totalAmount;
        const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
        const status = getPaymentStatus(paidAmount, totalAmount);
        
        return (
            <div className="flex flex-col gap-2">
                <span className={status.color}>{status.text}</span>
                <Progress value={progress} className="h-2" />
            </div>
        )
    }
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
                <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
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
