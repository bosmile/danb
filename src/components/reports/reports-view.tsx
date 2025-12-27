import type { InvoiceSerializable } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { format } from 'date-fns';
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

export function ReportsView({ allInvoicesData }: ReportsViewProps) {
  const exportData = allInvoicesData.map(inv => ({
    Ngay: format(new Date(inv.date), 'dd/MM/yyyy'),
    Loai: inv.category,
    SanPham: inv.productName,
    SoLuong: inv.quantity,
    DonGia: inv.price,
    Tong: inv.total,
  }));

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Báo cáo chi tiết hóa đơn</CardTitle>
                    <CardDescription>Danh sách tất cả các hóa đơn theo khoảng thời gian đã chọn.</CardDescription>
                </div>
                <ExportButtons data={exportData} filename="BaoCao_TongHop" sheetName="TongHop" />
            </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-right">SL</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">Tổng</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {allInvoicesData.length > 0 ? allInvoicesData.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell>{format(new Date(inv.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell><CategoryBadge category={inv.category} /></TableCell>
                      <TableCell>{inv.productName}</TableCell>
                      <TableCell className="text-right">{inv.quantity}</TableCell>
                      <TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(inv.price)}</TableCell>
                      <TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(inv.total)}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">Không có dữ liệu.</TableCell>
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
