'use client';

import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/export";
import { FileDown, Printer } from "lucide-react";

interface ExportButtonsProps {
    data: any[];
    filename: string;
    sheetName: string;
}

export function ExportButtons({ data, filename, sheetName }: ExportButtonsProps) {
    const handleExcelExport = () => {
        exportToExcel(data, filename, sheetName);
    };

    const handlePrint = () => {
        window.print();
    }

    return (
        <div className="flex gap-2 print-hidden">
            <Button variant="outline" size="sm" onClick={handleExcelExport} disabled={data.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Xuất Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={data.length === 0}>
                <Printer className="mr-2 h-4 w-4" />
                In báo cáo
            </Button>
        </div>
    );
}
