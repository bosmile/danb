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
