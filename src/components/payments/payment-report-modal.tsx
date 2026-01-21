'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import type { PaymentSerializable } from '@/types';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { ExportButtons } from '../reports/export-buttons';

type PaymentReportModalProps = {
  payment: PaymentSerializable;
  children: React.ReactNode;
};

const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export function PaymentReportModal({ payment, children }: PaymentReportModalProps) {
  const reportData = useMemo(() => {
    try {
        return JSON.parse(payment.reportSnapshot);
    } catch (e) {
        console.error("Failed to parse report snapshot", e);
        return [];
    }
  }, [payment.reportSnapshot]);

  const formatBuyerDetails = (detailsByBuyer: { [buyer: string]: { quantity: number; quantityByPlace: { [place: string]: number } } }) => {
    if (!detailsByBuyer) return '';
    return Object.entries(detailsByBuyer).map(([buyer, details]) => {
        const placeDetails = Object.entries(details.quantityByPlace).map(([place, qty]) => `${place}: ${qty}`).join(', ');
        return `${buyer}: ${details.quantity} (${placeDetails})`;
    }).join('; ');
  };

  const exportData = reportData.map((item: any) => ({
      Loai: item.category,
      SanPham: item.productName,
      TongSL: item.totalQuantity,
      ChiTiet: formatBuyerDetails(item.detailsByBuyer),
      TongTien: item.totalAmount,
      DonGiaTB: item.totalQuantity > 0 ? item.totalAmount / item.totalQuantity : 0,
  }));

  const filename = `ThanhToan_${format(new Date(payment.startDate), 'ddMMyy')}-${format(new Date(payment.endDate), 'ddMMyy')}`;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chi tiết kỳ thanh toán</DialogTitle>
          <DialogDescription>
            Báo cáo cho kỳ từ {format(new Date(payment.startDate), 'dd/MM/yyyy')} đến {format(new Date(payment.endDate), 'dd/MM/yyyy')}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-shrink-0 flex justify-end">
            <ExportButtons 
                data={exportData} 
                filename={filename} 
                sheetName="ThanhToan"
            />
        </div>
        
        <div className="flex-grow overflow-y-auto mt-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Loại</TableHead>
                            <TableHead>Sản phẩm</TableHead>
                            <TableHead className="text-right">Tổng SL</TableHead>
                            <TableHead className="text-right">Đơn giá TB</TableHead>
                            <TableHead className="text-right">Tổng tiền</TableHead>
                            <TableHead>Chi tiết SL</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.length > 0 ? (
                             reportData.map((item: any, index: number) => (
                                <TableRow key={index}>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell className="text-right">{item.totalQuantity}</TableCell>
                                    <TableCell className="text-right">{currencyFormatter(item.totalQuantity > 0 ? item.totalAmount / item.totalQuantity : 0)}</TableCell>
                                    <TableCell className="text-right">{currencyFormatter(item.totalAmount)}</TableCell>
                                    <TableCell>{formatBuyerDetails(item.detailsByBuyer)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">Không có dữ liệu.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                     <TableFooter>
                        <TableRow className="text-lg font-bold bg-secondary hover:bg-secondary">
                            <TableCell colSpan={4} className="text-right">TỔNG CỘNG</TableCell>
                            <TableCell className="text-right">{currencyFormatter(payment.totalAmount)}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
