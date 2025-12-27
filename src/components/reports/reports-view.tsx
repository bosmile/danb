import type { InvoiceSerializable } from "@/types";
import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ExportButtons } from "./export-buttons";
import { Badge } from "../ui/badge";
import { format } from "date-fns";

const CategoryBadge = ({ category }: { category: InvoiceSerializable['category'] }) => {
    const variant: "default" | "secondary" | "destructive" =
        category === 'BIGC' ? 'default' : category === 'SPLZD' ? 'secondary' : 'destructive';
    const text = category === 'OTHER' ? 'Khác' : category;

    return <Badge variant={variant}>{text}</Badge>
};

interface ReportsViewProps {
    allInvoicesData: InvoiceSerializable[];
}

export function ReportsView({ allInvoicesData }: ReportsViewProps) {
  const { categoryTotals, grandTotal, sortedInvoices } = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {
        BIGC: 0,
        SPLZD: 0,
        OTHER: 0,
    };
    let grandTotal = 0;

    allInvoicesData.forEach(invoice => {
      const category = invoice.category;
      grandTotal += invoice.grandTotal;
      if (categoryTotals[category] !== undefined) {
          categoryTotals[category] += invoice.grandTotal;
      }
    });

    const sortedInvoices = [...allInvoicesData].sort((a, b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return { 
        categoryTotals,
        grandTotal,
        sortedInvoices,
    };
  }, [allInvoicesData]);

  const exportData = sortedInvoices.flatMap(invoice => 
    (invoice.items || []).map(item => ({
      Ngay: format(new Date(invoice.date), 'dd/MM/yyyy'),
      Loai: invoice.category,
      NguoiMua: invoice.buyer,
      GhiChu: invoice.notes || '',
      SanPham: item.productName,
      SoLuong: item.quantity,
      DonGia: item.price,
      Tong: item.total,
    }))
  );

  const renderInvoiceRows = (category: InvoiceSerializable['category']) => {
      const categoryInvoices = sortedInvoices.filter(invoice => invoice.category === category);
      if (categoryInvoices.length === 0) return null;
      
      let runningTotal = 0;

      const rows = categoryInvoices.flatMap(invoice => {
           const invoiceItems = invoice.items || [];
           runningTotal += invoice.grandTotal;

           return invoiceItems.map((item, itemIndex) => (
                <TableRow key={`${invoice.id}-${itemIndex}`}>
                    {itemIndex === 0 && (
                        <>
                            <TableCell rowSpan={invoiceItems.length} className="align-top">
                                {format(new Date(invoice.date), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell rowSpan={invoiceItems.length} className="align-top"><CategoryBadge category={invoice.category} /></TableCell>
                            <TableCell rowSpan={invoiceItems.length} className="align-top">{invoice.buyer}</TableCell>
                            <TableCell rowSpan={invoiceItems.length} className="align-top max-w-[200px] whitespace-pre-wrap break-words">{invoice.notes}</TableCell>
                        </>
                    )}
                    <TableCell>{item.productName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                        {new Intl.NumberFormat('vi-VN').format(item.price)}
                    </TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(item.total)}</TableCell>
                    {itemIndex === 0 && (
                         <TableCell rowSpan={invoiceItems.length} className="text-right align-top font-medium">
                            {new Intl.NumberFormat('vi-VN').format(invoice.grandTotal)}
                        </TableCell>
                    )}
                </TableRow>
           ))
      });

      return (
        <>
            {rows}
            <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={8} className="text-right">Tổng {category === 'OTHER' ? 'Khác' : category}</TableCell>
                <TableCell className="text-right">
                    {new Intl.NumberFormat('vi-VN').format(categoryTotals[category])}
                </TableCell>
            </TableRow>
        </>
      )
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Báo cáo chi tiết</CardTitle>
                    <CardDescription>Báo cáo chi tiết theo từng hóa đơn và sản phẩm.</CardDescription>
                </div>
                <ExportButtons data={exportData} filename="BaoCao_ChiTiet_TheoHoaDon" sheetName="ChiTiet" />
            </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Ngày</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Người mua</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-right">SL</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">Tổng</TableHead>
                    <TableHead className="text-right">Tổng HĐ</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {sortedInvoices.length > 0 ? (
                    <>
                        {renderInvoiceRows('BIGC')}
                        {renderInvoiceRows('SPLZD')}
                        {renderInvoiceRows('OTHER')}
                    </>
                ) : (
                    <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">Không có dữ liệu.</TableCell>
                    </TableRow>
                )}
                </TableBody>
                 <TableFooter>
                    <TableRow className="text-lg font-bold bg-secondary hover:bg-secondary">
                        <TableCell colSpan={8} className="text-right">TỔNG CỘNG</TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(grandTotal)}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
