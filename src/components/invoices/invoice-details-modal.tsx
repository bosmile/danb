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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chi tiết hóa đơn</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm py-4">
            <div>
                <p className="font-medium text-muted-foreground">Ngày</p>
                <p>{format(new Date(invoice.date), 'dd/MM/yyyy')}</p>
            </div>
             <div>
                <p className="font-medium text-muted-foreground">Loại</p>
                <Badge variant={invoice.category === 'BIGC' ? 'default' : invoice.category === 'SPLZD' ? 'secondary' : 'destructive'}>
                    {invoice.category === 'OTHER' ? 'Khác' : invoice.category}
                </Badge>
            </div>
            <div>
                <p className="font-medium text-muted-foreground">Người mua</p>
                <p>{invoice.buyer}</p>
            </div>
            <div>
                <p className="font-medium text-muted-foreground">Tổng cộng</p>
                <p className="font-bold">{currencyFormatter(invoice.grandTotal)}</p>
            </div>
            {invoice.notes && (
                 <div className="col-span-full">
                    <p className="font-medium text-muted-foreground">Ghi chú</p>
                    <p className="whitespace-pre-wrap">{invoice.notes}</p>
                </div>
            )}
        </div>

        <Separator />

        <div className="mt-4">
            <h4 className="font-semibold mb-2">Danh sách sản phẩm</h4>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Nơi nhận</TableHead>
                        <TableHead className="text-right">SL</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Tổng</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {invoice.items.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell>{item.receivingPlace}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{currencyFormatter(item.price)}</TableCell>
                            <TableCell className="text-right">{currencyFormatter(item.total)}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={4} className="text-right font-bold">Tổng cộng</TableCell>
                            <TableCell className="text-right font-bold">{currencyFormatter(invoice.grandTotal)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
