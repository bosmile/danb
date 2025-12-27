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

type OtherReportData = {
    productName: string;
    totalQuantity: number;
    totalAmount: number;
};

interface ReportsViewProps {
    bigCData: InvoiceSerializable[];
    otherData: OtherReportData[];
}

export function ReportsView({ bigCData, otherData }: ReportsViewProps) {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Báo cáo chi tiết (BIGC)</CardTitle>
                    <CardDescription>Danh sách các hóa đơn từ BIGC theo thứ tự thời gian.</CardDescription>
                </div>
                <ExportButtons data={bigCData} filename="BaoCao_BIGC" sheetName="BIGC" />
            </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-right">SL</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">Tổng</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {bigCData.length > 0 ? bigCData.map(inv => (
                    <TableRow key={inv.id}>
                    <TableCell>{format(new Date(inv.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{inv.productName}</TableCell>
                    <TableCell className="text-right">{inv.quantity}</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(inv.price)}</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(inv.total)}</TableCell>
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
      
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Báo cáo tổng hợp (SPLZD & Khác)</CardTitle>
                    <CardDescription>Tổng hợp số lượng và giá trị theo từng sản phẩm.</CardDescription>
                </div>
                <ExportButtons data={otherData} filename="BaoCao_TongHop" sheetName="TongHop" />
            </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-right">Tổng số lượng</TableHead>
                    <TableHead className="text-right">Tổng giá trị</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {otherData.length > 0 ? otherData.map(item => (
                    <TableRow key={item.productName}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell className="text-right">{item.totalQuantity}</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(item.totalAmount)}</TableCell>
                    </TableRow>
                )) : (
                     <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">Không có dữ liệu.</TableCell>
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
