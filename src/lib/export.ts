'use client';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { InterRegular } from './fonts/inter-regular';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export const exportToExcel = (data: any[], fileName: string, sheetName: string): void => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const excelFileName = `${fileName}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
  XLSX.writeFile(wb, excelFileName);
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const formatBuyerDetails = (detailsByBuyer: { [buyer: string]: { quantity: number; quantityByPlace: { [place: string]: number } } }) => {
    return Object.entries(detailsByBuyer).map(([buyer, details]) => {
        const placeDetails = Object.entries(details.quantityByPlace).map(([place, qty]) => `${place}: ${qty}`).join(', ');
        return `${buyer}: ${details.quantity} (${placeDetails})`;
    }).join('; ');
};

interface ExportPdfWithGroupingProps {
    data: any[];
    categoryTotals: { [key: string]: number };
    grandTotal: number;
    headers: string[];
    filename: string;
}

export const exportToPdfWithGrouping = ({ data, categoryTotals, grandTotal, headers, filename }: ExportPdfWithGroupingProps) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    doc.addFileToVFS('Inter-Regular.ttf', InterRegular);
    doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');
    doc.setFont('Inter');

    const body: any[] = [];
    const categories = ['BIGC', 'SPLZD', 'OTHER'];

    categories.forEach(category => {
        const categoryItems = data.filter(item => item.category === category);
        if (categoryItems.length > 0) {
            categoryItems.forEach(item => {
                body.push([
                    item.category,
                    item.productName,
                    item.totalQuantity,
                    formatCurrency(item.totalQuantity > 0 ? item.totalAmount / item.totalQuantity : 0),
                    formatCurrency(item.totalAmount),
                    formatBuyerDetails(item.detailsByBuyer),
                ]);
            });
            body.push([
                { content: `Tổng ${category === 'OTHER' ? 'Khác' : category}`, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: formatCurrency(categoryTotals[category]), styles: { halign: 'right', fontStyle: 'bold' } },
                { content: '', styles: { fontStyle: 'bold' } },
            ]);
        }
    });

    doc.autoTable({
        head: [headers],
        body: body,
        theme: 'grid',
        styles: { font: 'Inter', cellPadding: 2, fontSize: 8 },
        headStyles: { fillColor: [241, 245, 249], textColor: [100, 116, 139], fontStyle: 'bold' },
        didParseCell: function (data) {
            if (data.row.raw.some((cell: any) => cell.content?.includes('Tổng '))) {
                data.cell.styles.fillColor = [241, 245, 249]; // bg-muted/50
                data.cell.styles.fontStyle = 'bold';
            }
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.autoTable({
        startY: finalY + 2,
        body: [
            [
                { content: 'TỔNG CỘNG', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } },
                { content: `${formatCurrency(grandTotal)} VND`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } },
                { content: '' },
            ],
        ],
        theme: 'plain',
        styles: { font: 'Inter' }
    });

    doc.save(filename);
};


export const exportToPdf = (headers: string[], body: any[][], fileName: string): void => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  
  // Add the font to jsPDF
  doc.addFileToVFS('Inter-Regular.ttf', InterRegular);
  doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');
  doc.setFont('Inter');

  doc.autoTable({
    head: [headers],
    body: body,
    styles: { font: 'Inter', fontStyle: 'normal' },
    headStyles: { fillColor: [63, 81, 181] }, // #3F51B5
  });
  doc.save(fileName);
};
