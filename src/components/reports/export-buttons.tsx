'use client';

import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/export";
import { FileDown } from "lucide-react";

interface ExportButtonsProps {
    data: any[];
    filename: string;
    sheetName: string;
    onPdfExport: () => void;
}

export function ExportButtons({ data, filename, sheetName, onPdfExport }: ExportButtonsProps) {
    const handleExcelExport = () => {
        exportToExcel(data, filename, sheetName);
    };

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExcelExport} disabled={data.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Xuất Excel
            </Button>
            <Button variant="outline" size="sm" onClick={onPdfExport} disabled={data.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Xuất PDF
            </Button>
        </div>
    );
}
