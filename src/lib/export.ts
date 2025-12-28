'use client';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportToExcel = (data: any[], fileName: string, sheetName: string): void => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `${fileName}.xlsx`);
};
