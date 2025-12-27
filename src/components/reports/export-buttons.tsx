'use client';

import { Button } from "@/components/ui/button";
import { exportToExcel, exportToPdf } from "@/lib/export";
import { FileDown } from "lucide-react";

interface ExportButtonsProps {
    data: any[];
    filename: string;
    sheetName: string;
}

export function ExportButtons({ data, filename, sheetName }: ExportButtonsProps) {
    const handleExcelExport = () => {
        exportToExcel(data, filename, sheetName);
    };

    const handlePdfExport = () => {
        const headers = Object.keys(data[0] || {});
        const body = data.map(row => Object.values(row));
        exportToPdf(headers, body, `${filename}.pdf`);
    };

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExcelExport} disabled={data.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Xuất Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handlePdfExport} disabled={data.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Xuất PDF
            </Button>
        </div>
    );
}
