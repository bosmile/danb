import type { InvoiceSerializable } from "@/types";
import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ExportButtons } from "./export-buttons";
import { Badge } from "../ui/badge";

const CategoryBadge = ({ category }: { category: InvoiceSerializable['category'] }) => {
    const variant: "default" | "secondary" | "destructive" =
        category === 'BIGC' ? 'default' : category === 'SPLZD' ? 'secondary' : 'destructive';
    const text = category === 'OTHER' ? 'Khác' : category;

    return <Badge variant={variant}>{text}</Badge>
};

interface ReportsViewProps {
    allInvoicesData: InvoiceSerializable[];
}

interface GroupedProduct {
    productName: string;
    category: InvoiceSerializable['category'];
    quantity: number;
    total: number;
}

export function ReportsView({ allInvoicesData }: ReportsViewProps) {
  const groupedData = useMemo(() => {
    const groups: { [key: string]: GroupedProduct } = {};

    allInvoicesData.forEach(invoice => {
      invoice.items.forEach(item => {
        const key = `${item.productName}-${invoice.category}`;
        if (!groups[key]) {
          groups[key] = {
            productName: item.productName,
            category: invoice.category,
            quantity: 0,
            total: 0,
          };
        }
        groups[key].quantity += item.quantity;
        groups[key].total += item.total;
      });
    });

    return Object.values(groups);
  }, [allInvoicesData]);

  const exportData = groupedData.map(item => ({
    Loai: item.category,
    SanPham: item.productName,
    SoLuong: item.quantity,
    Tong: item.total,
    DonGiaBinhQuan: item.quantity > 0 ? item.total / item.quantity : 0,
  }));

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Báo cáo tổng hợp</CardTitle>
                    <CardDescription>Báo cáo tổng hợp số lượng và chi tiêu theo từng sản phẩm.</CardDescription>
                </div>
                <ExportButtons data={exportData} filename="BaoCao_TongHop_TheoSanPham" sheetName="TongHop" />
            </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Loại</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-right">Tổng số lượng</TableHead>
                    <TableHead className="text-right">Đơn giá bình quân</TableHead>
                    <TableHead className="text-right">Tổng chi tiêu</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {groupedData.length > 0 ? groupedData.map(item => (
                    <TableRow key={`${item.productName}-${item.category}`}>
                      <TableCell><CategoryBadge category={item.category} /></TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity > 0 ? new Intl.NumberFormat('vi-VN').format(item.total / item.quantity) : 0}
                      </TableCell>
                      <TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(item.total)}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">Không có dữ liệu.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
