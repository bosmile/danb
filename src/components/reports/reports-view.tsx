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

interface ReportsViewProps {
    allInvoicesData: InvoiceSerializable[];
}

export function ReportsView({ allInvoicesData }: ReportsViewProps) {

  const { groupedData, categoryTotals, grandTotal } = useMemo(() => {
    const groups: { [key: string]: { 
        productName: string; 
        category: string; 
        buyer: string; 
        quantity: number; 
        total: number;
        quantityByPlace: { [place: string]: number };
     } } = {};
    const categoryTotals: { [key: string]: number } = {
        BIGC: 0,
        SPLZD: 0,
        OTHER: 0,
    };
    let grandTotal = 0;

    allInvoicesData.forEach(invoice => {
      const items = invoice.items || [];
      grandTotal += invoice.grandTotal;
      if (categoryTotals[invoice.category] !== undefined) {
          categoryTotals[invoice.category] += invoice.grandTotal;
      }
      items.forEach(item => {
        const key = `${item.productName}-${invoice.category}-${invoice.buyer}`;
        if (!groups[key]) {
          groups[key] = {
            productName: item.productName,
            category: invoice.category,
            buyer: invoice.buyer,
            quantity: 0,
            total: 0,
            quantityByPlace: {},
          };
        }
        groups[key].quantity += item.quantity;
        groups[key].total += item.total;
        
        const place = invoice.receivingPlace;
        if (!groups[key].quantityByPlace[place]) {
            groups[key].quantityByPlace[place] = 0;
        }
        groups[key].quantityByPlace[place] += item.quantity;
      });
    });

    const sortedGroupedData = Object.values(groups).sort((a, b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        if (a.productName < b.productName) return -1;
        if (a.productName > b.productName) return 1;
        return 0;
    });

    return { 
        groupedData: sortedGroupedData,
        categoryTotals,
        grandTotal,
    };
  }, [allInvoicesData]);

  const exportData = groupedData.map(item => ({
      Loai: item.category,
      NguoiMua: item.buyer,
      SanPham: item.productName,
      SoLuong: item.quantity,
      ChiTietSL: Object.entries(item.quantityByPlace).map(([place, qty]) => `${place}: ${qty}`).join(', '),
      Tong: item.total,
      DonGiaTB: item.quantity > 0 ? item.total / item.quantity : 0
  }));
  
  const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  const renderCategoryRows = (category: 'BIGC' | 'SPLZD' | 'OTHER') => {
    const categoryItems = groupedData.filter(item => item.category === category);
    if (categoryItems.length === 0) return null;

    return (
        <>
            {categoryItems.map((item, index) => (
                <TableRow key={index}>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.buyer}</TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell>{Object.entries(item.quantityByPlace).map(([place, qty]) => `${place}: ${qty}`).join(', ')}</TableCell>
                    <TableCell className="text-right">{currencyFormatter(item.total)}</TableCell>
                    <TableCell className="text-right">{currencyFormatter(item.quantity > 0 ? item.total / item.quantity : 0)}</TableCell>
                </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={6} className="text-right">Tổng {category === 'OTHER' ? 'Khác' : category}</TableCell>
                <TableCell className="text-right">
                    {currencyFormatter(categoryTotals[category])}
                </TableCell>
            </TableRow>
        </>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Báo cáo theo sản phẩm</CardTitle>
                    <CardDescription>Báo cáo tổng hợp số lượng và giá trị theo từng sản phẩm.</CardDescription>
                </div>
                <ExportButtons data={exportData} filename="BaoCao_TheoSanPham" sheetName="TheoSanPham" />
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
                    <TableHead className="text-right">Tổng SL</TableHead>
                    <TableHead>Chi tiết SL</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead className="text-right">Đơn giá TB</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {groupedData.length > 0 ? (
                    <>
                        {renderCategoryRows('BIGC')}
                        {renderCategoryRows('SPLZD')}
                        {renderCategoryRows('OTHER')}
                    </>
                ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">Không có dữ liệu.</TableCell>
                    </TableRow>
                )}
                </TableBody>
                 <TableFooter>
                    <TableRow className="text-lg font-bold bg-secondary hover:bg-secondary">
                        <TableCell colSpan={6} className="text-right">TỔNG CỘNG</TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0}).format(grandTotal)}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
