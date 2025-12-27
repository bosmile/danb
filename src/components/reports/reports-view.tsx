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
    buyer: InvoiceSerializable['buyer'];
    quantity: number;
    total: number;
}

export function ReportsView({ allInvoicesData }: ReportsViewProps) {
  const { groupedData, categoryTotals, grandTotal } = useMemo(() => {
    const groups: { [key: string]: GroupedProduct } = {};
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

      (invoice.items || []).forEach(item => {
        const key = `${item.productName}-${invoice.category}-${invoice.buyer}`;
        if (!groups[key]) {
          groups[key] = {
            productName: item.productName,
            category: invoice.category,
            buyer: invoice.buyer,
            quantity: 0,
            total: 0,
          };
        }
        groups[key].quantity += item.quantity;
        groups[key].total += item.total;
      });
    });

    return { 
        groupedData: Object.values(groups),
        categoryTotals,
        grandTotal
    };
  }, [allInvoicesData]);

  const exportData = groupedData.map(item => ({
    Loai: item.category,
    NguoiMua: item.buyer,
    SanPham: item.productName,
    SoLuong: item.quantity,
    Tong: item.total,
    DonGiaBinhQuan: item.quantity > 0 ? item.total / item.quantity : 0,
  }));

  const renderCategoryRow = (category: InvoiceSerializable['category']) => {
      const categoryItems = groupedData.filter(item => item.category === category);
      if (categoryItems.length === 0) return null;

      return (
          <>
            {categoryItems.map(item => (
                 <TableRow key={`${item.productName}-${item.category}-${item.buyer}`}>
                    <TableCell><CategoryBadge category={item.category} /></TableCell>
                    <TableCell>{item.buyer}</TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                    {item.quantity > 0 ? new Intl.NumberFormat('vi-VN').format(item.total / item.quantity) : 0}
                    </TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(item.total)}</TableCell>
                </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={5} className="text-right">Tổng {category === 'OTHER' ? 'Khác' : category}</TableCell>
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
                    <TableHead>Người mua</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-right">Tổng số lượng</TableHead>
                    <TableHead className="text-right">Đơn giá bình quân</TableHead>
                    <TableHead className="text-right">Tổng chi tiêu</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {groupedData.length > 0 ? (
                    <>
                        {renderCategoryRow('BIGC')}
                        {renderCategoryRow('SPLZD')}
                        {renderCategoryRow('OTHER')}
                    </>
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">Không có dữ liệu.</TableCell>
                    </TableRow>
                )}
                </TableBody>
                 <TableFooter>
                    <TableRow className="text-lg font-bold bg-secondary hover:bg-secondary">
                        <TableCell colSpan={5} className="text-right">TỔNG CỘNG</TableCell>
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
