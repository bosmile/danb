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
import { Textarea } from "../ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

interface ReportsViewProps {
    allInvoicesData: InvoiceSerializable[];
}

export function ReportsView({ allInvoicesData }: ReportsViewProps) {
  const isMobile = useIsMobile();

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
        
        if (!group.detailsByBuyer[invoice.buyer]) {
            group.detailsByBuyer[invoice.buyer] = {
                quantity: 0,
                quantityByPlace: {},
            };
        }

        const buyerDetails = group.detailsByBuyer[invoice.buyer];
        buyerDetails.quantity += item.quantity;

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
        if (a.productName < a.productName) return -1;
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

  const renderMobileCategory = (category: 'BIGC' | 'SPLZD' | 'OTHER') => {
    const categoryItems = groupedData.filter(item => item.category === category);
    if (categoryItems.length === 0) return null;
    const categoryName = category === 'OTHER' ? 'Khác' : category;
    
    return (
        <div key={category}>
            <div className="px-4 py-2 bg-muted/50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Loại: {categoryName}</span>
                <span className="text-[10px] font-bold text-primary">{categoryItems.length} SẢN PHẨM</span>
            </div>
            <div className="divide-y divide-border">
                {categoryItems.map((item, index) => (
                    <div key={index} className="p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm font-semibold flex-1 leading-snug">{item.productName}</h4>
                             <Badge variant={item.category === 'BIGC' ? 'default' : item.category === 'SPLZD' ? 'secondary' : 'destructive'}>
                                {item.category === 'OTHER' ? 'Khác' : item.category}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center border-t border-border pt-3">
                            <div>
                                <div className="text-[9px] uppercase font-bold text-muted-foreground">Số lượng</div>
                                <div className="text-xs font-semibold">{item.totalQuantity}</div>
                            </div>
                            <div>
                                <div className="text-[9px] uppercase font-bold text-muted-foreground">Đơn giá TB</div>
                                <div className="text-xs font-semibold">{currencyFormatter(item.totalQuantity > 0 ? item.totalAmount / item.totalQuantity : 0)}</div>
                            </div>
                            <div className="items-end flex flex-col">
                                <div className="text-[9px] uppercase font-bold text-muted-foreground">Tổng tiền</div>
                                <div className="text-xs font-bold text-primary">{currencyFormatter(item.totalAmount)}</div>
                            </div>
                        </div>
                         <p className="text-xs text-muted-foreground pt-2 border-t border-border">{formatBuyerDetails(item.detailsByBuyer)}</p>
                    </div>
                ))}
            </div>
             <div className="px-4 py-3 bg-primary/5 flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground">Tổng {categoryName}</span>
                <span className="text-sm font-bold text-foreground">{currencyFormatter(categoryTotals[category])}</span>
            </div>
        </div>
    );
  };

  if (isMobile === undefined) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
        {isMobile ? (
             <Card className="rounded-2xl shadow-sm overflow-hidden">
                 <CardHeader className="flex-row justify-between items-center">
                    <CardTitle className="text-base font-bold">Báo cáo theo sản phẩm</CardTitle>
                    <ExportButtons 
                        data={exportData} 
                        filename="BaoCao_TheoSanPham" 
                        sheetName="TheoSanPham"
                    />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {renderMobileCategory('BIGC')}
                        {renderMobileCategory('SPLZD')}
                        {renderMobileCategory('OTHER')}
                    </div>
                    <div className="p-6 bg-foreground text-background flex justify-between items-center">
                        <span className="text-sm font-bold uppercase tracking-widest">TỔNG CỘNG</span>
                        <span className="text-xl font-bold text-primary">{currencyFormatter(grandTotal)}</span>
                    </div>
                </CardContent>
            </Card>
        ) : (
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
        )}
     
      <Card>
        <CardHeader>
            <CardTitle>Ghi chú</CardTitle>
        </CardHeader>
        <CardContent>
            <Textarea placeholder="Thêm ghi chú cho báo cáo..." />
        </CardContent>
      </Card>
    </div>
  );
}
