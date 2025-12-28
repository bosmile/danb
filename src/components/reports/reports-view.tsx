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
import { exportToPdfWithGrouping } from "@/lib/export";
import { format } from "date-fns";

interface ReportsViewProps {
    allInvoicesData: InvoiceSerializable[];
}

export function ReportsView({ allInvoicesData }: ReportsViewProps) {

  const { groupedData, categoryTotals, grandTotal } = useMemo(() => {
    const groups: { 
        [key: string]: {
            productName: string;
            category: string;
            totalQuantity: number;
            totalAmount: number;
            detailsByBuyer: {
                [buyer: string]: {
                    quantity: number;
                    quantityByPlace: { [place: string]: number };
                };
            };
        };
    } = {};

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
        const key = `${item.productName}-${invoice.category}`; // Group by product and category

        if (!groups[key]) {
          groups[key] = {
            productName: item.productName,
            category: invoice.category,
            totalQuantity: 0,
            totalAmount: 0,
            detailsByBuyer: {},
          };
        }
        
        const group = groups[key];
        group.totalQuantity += item.quantity;
        group.totalAmount += item.total;
        
        // Initialize buyer details if not present
        if (!group.detailsByBuyer[invoice.buyer]) {
            group.detailsByBuyer[invoice.buyer] = {
                quantity: 0,
                quantityByPlace: {},
            };
        }

        // Update buyer details
        const buyerDetails = group.detailsByBuyer[invoice.buyer];
        buyerDetails.quantity += item.quantity;

        // Update quantity by receiving place for the buyer
        const place = item.receivingPlace;
        if (!buyerDetails.quantityByPlace[place]) {
            buyerDetails.quantityByPlace[place] = 0;
        }
        buyerDetails.quantityByPlace[place] += item.quantity;
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

  const formatBuyerDetails = (detailsByBuyer: { [buyer: string]: { quantity: number; quantityByPlace: { [place: string]: number } } }) => {
    return Object.entries(detailsByBuyer).map(([buyer, details]) => {
        const placeDetails = Object.entries(details.quantityByPlace).map(([place, qty]) => `${place}: ${qty}`).join(', ');
        return `${buyer}: ${details.quantity} (${placeDetails})`;
    }).join('; ');
  };

  const exportData = groupedData.map(item => ({
      Loai: item.category,
      SanPham: item.productName,
      TongSL: item.totalQuantity,
      ChiTiet: formatBuyerDetails(item.detailsByBuyer),
      TongTien: item.totalAmount,
      DonGiaTB: item.totalQuantity > 0 ? item.totalAmount / item.totalQuantity : 0,
  }));
  
  const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  const handlePdfExport = () => {
    const filename = `BaoCao_TheoSanPham_${format(new Date(), 'yyyyMMdd')}.pdf`;
    exportToPdfWithGrouping({
      data: groupedData,
      categoryTotals,
      grandTotal,
      headers: ['Loại', 'Sản phẩm', 'Tổng SL', 'Đơn giá TB', 'Tổng tiền', 'Chi tiết SL'],
      filename
    });
  }

  const renderCategoryRows = (category: 'BIGC' | 'SPLZD' | 'OTHER') => {
    const categoryItems = groupedData.filter(item => item.category === category);
    if (categoryItems.length === 0) return null;

    return (
        <>
            {categoryItems.map((item, index) => (
                <TableRow key={index}>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell className="text-right">{item.totalQuantity}</TableCell>
                    <TableCell className="text-right">{currencyFormatter(item.totalQuantity > 0 ? item.totalAmount / item.totalQuantity : 0)}</TableCell>
                    <TableCell className="text-right">{currencyFormatter(item.totalAmount)}</TableCell>
                    <TableCell>{formatBuyerDetails(item.detailsByBuyer)}</TableCell>
                </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={4} className="text-right">Tổng {category === 'OTHER' ? 'Khác' : category}</TableCell>
                <TableCell className="text-right">
                    {currencyFormatter(categoryTotals[category])}
                </TableCell>
                <TableCell></TableCell>
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
                <ExportButtons 
                  data={exportData} 
                  filename="BaoCao_TheoSanPham" 
                  sheetName="TheoSanPham"
                  onPdfExport={handlePdfExport}
                />
            </div>
        </CardHeader>
        <CardContent>
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
                {groupedData.length > 0 ? (
                    <>
                        {renderCategoryRows('BIGC')}
                        {renderCategoryRows('SPLZD')}
                        {renderCategoryRows('OTHER')}
                    </>
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">Không có dữ liệu.</TableCell>
                    </TableRow>
                )}
                </TableBody>
                 <TableFooter>
                    <TableRow className="text-lg font-bold bg-secondary hover:bg-secondary">
                        <TableCell colSpan={4} className="text-right">TỔNG CỘNG</TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0}).format(grandTotal)}</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
