'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import type { InvoiceSerializable } from '@/types';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

type InvoiceDetailsModalProps = {
  invoice: InvoiceSerializable;
  children: React.ReactNode;
};

const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export function InvoiceDetailsModal({ invoice, children }: InvoiceDetailsModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[98vw] sm:w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="text-2xl font-bold">Chi tiết hóa đơn</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 shrink-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div>
                    <p className="text-muted-foreground mb-1">Ngày</p>
                    <p className="font-semibold text-base">{format(new Date(invoice.date), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                    <p className="text-muted-foreground mb-1">Loại</p>
                    <Badge className={cn(
                        "font-bold px-3 py-1",
                        invoice.category === 'BIGC' ? 'bg-[#f59e0b] hover:bg-[#d97706] text-white border-none' : 
                        invoice.category === 'SPLZD' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-none' : 
                        'bg-red-100 text-red-700 hover:bg-red-200 border-none'
                    )}>
                        {invoice.category === 'OTHER' ? 'Khác' : invoice.category}
                    </Badge>
                </div>
                <div>
                    <p className="text-muted-foreground mb-1">Người mua</p>
                    <p className="font-semibold text-base">{invoice.buyer}</p>
                </div>
                <div>
                    <p className="text-muted-foreground mb-1 text-right sm:text-left">Tổng cộng</p>
                    <p className="font-bold text-xl text-right sm:text-left">{currencyFormatter(invoice.grandTotal)}</p>
                </div>
            </div>
        </div>

        <Separator className="mx-6 w-auto" />

        <div className="p-6 pt-4 flex-1 overflow-hidden flex flex-col">
            <h4 className="text-xl font-bold mb-4 shrink-0">Danh sách sản phẩm</h4>
            <div className="border rounded-xl overflow-hidden flex-1 flex flex-col">
                <div className="overflow-auto flex-1">
                    <Table className="relative w-full">
                        <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                        <TableRow className="hover:bg-transparent border-b">
                            <TableHead className="min-w-[160px] h-10 py-2">Sản phẩm</TableHead>
                            <TableHead className="whitespace-nowrap h-10 py-2">Nơi nhận</TableHead>
                            <TableHead className="text-right whitespace-nowrap h-10 py-2">SL</TableHead>
                            <TableHead className="text-right whitespace-nowrap h-10 py-2">Đơn giá</TableHead>
                            <TableHead className="text-right whitespace-nowrap h-10 py-2">Tổng</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {invoice.items.map((item, index) => (
                            <TableRow key={index} className="group">
                                <TableCell className="font-medium py-4 align-top leading-tight">{item.productName}</TableCell>
                                <TableCell className="whitespace-nowrap py-4 align-top text-muted-foreground">{item.receivingPlace}</TableCell>
                                <TableCell className="text-right whitespace-nowrap py-4 align-top font-semibold">{item.quantity}</TableCell>
                                <TableCell className="text-right whitespace-nowrap py-4 align-top text-muted-foreground">{currencyFormatter(item.price)}</TableCell>
                                <TableCell className="text-right whitespace-nowrap py-4 align-top font-bold">{currencyFormatter(item.total)}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="bg-muted/30 p-4 border-t shrink-0">
                    <div className="flex justify-between items-center px-4">
                        <span className="font-bold text-lg text-muted-foreground">Tổng cộng</span>
                        <span className="font-black text-xl">{currencyFormatter(invoice.grandTotal)}</span>
                    </div>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
