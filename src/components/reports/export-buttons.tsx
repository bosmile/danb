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
        <div className="flex flex-col sm:flex-row gap-2 print-hidden w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto h-11 sm:h-9 font-bold" onClick={handleExcelExport} disabled={data.length === 0}>
                <FileDown className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                Xuất Excel
            </Button>
            <Button variant="outline" className="w-full sm:w-auto h-11 sm:h-9 font-bold" onClick={handlePrint} disabled={data.length === 0}>
                <Printer className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                In báo cáo
            </Button>
        </div>
    );
}
