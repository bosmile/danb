'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InvoiceSerializable } from '@/types';
import { getInvoiceColumns } from './invoice-columns';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

interface InvoiceTableProps {
  data: InvoiceSerializable[];
  onDataChanged: () => void;
}

export function InvoiceTable({ data, onDataChanged }: InvoiceTableProps) {
  const [expandedRowId, setExpandedRowId] = React.useState<string | null>(null);
  const isMobile = useIsMobile();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
      imageUrl: false,
      buyer: false, 
      receivingPlace: false,
      ...(isMobile && { category: false, date: false, buyerAndPlace: false })
  });
  
  const columns = React.useMemo(() => getInvoiceColumns(onDataChanged), [onDataChanged]);

  React.useEffect(() => {
    setColumnVisibility(current => ({
      ...current,
      buyer: false,
      receivingPlace: false,
      imageUrl: false,
      ...(isMobile 
        ? { category: false, date: false, buyerAndPlace: false } 
        : { category: true, date: true, buyerAndPlace: true })
    }));
  }, [isMobile]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-center py-4 gap-2">
        <Input
          placeholder="Lọc theo sản phẩm..."
          value={(table.getColumn('items')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('items')?.setFilterValue(event.target.value)
          }
          className="w-full sm:max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto w-full sm:w-auto">
              Cột <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id === 'items' ? 'Sản phẩm' :
                     column.id === 'date' ? 'Ngày' :
                     column.id === 'category' ? 'Loại' :
                     column.id === 'buyer' ? 'Người mua' :
                     column.id === 'receivingPlace' ? 'Nơi nhận' :
                     column.id === 'grandTotal' ? 'Tổng cộng' :
                     column.id === 'imageUrl' ? 'Ảnh' :
                     column.id === 'actions' ? 'Hành động' : 
                     column.id === 'buyerAndPlace' ? 'Người mua - Nơi nhận' : column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.original.id}>
                    <TableRow 
                        data-state={row.getIsSelected() && 'selected'}
                        className={cn(
                            "transition-all duration-200 cursor-pointer select-none",
                            expandedRowId === row.original.id ? "bg-primary/5 hover:bg-primary/5" : "hover:bg-muted/50"
                        )}
                        onClick={(e) => {
                            // Check if the click was NOT on the actions column
                            const target = e.target as HTMLElement;
                            if (target.closest('[data-actions-cell]')) return;
                            setExpandedRowId(expandedRowId === row.original.id ? null : row.original.id);
                        }}
                    >
                    {row.getVisibleCells().map((cell, index) => (
                        <TableCell 
                            key={cell.id}
                            data-actions-cell={cell.column.id === 'actions' ? "true" : undefined}
                        >
                            <div className="flex items-center gap-2">
                                {index === 0 && (
                                    <ChevronDown className={cn(
                                        "h-4 w-4 transition-transform text-muted-foreground",
                                        expandedRowId === row.original.id ? "rotate-0" : "-rotate-90"
                                    )} />
                                )}
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                        </TableCell>
                    ))}
                    </TableRow>
                    {expandedRowId === row.original.id && (
                        <TableRow className="bg-primary/5 hover:bg-primary/5 border-b-2 border-primary/20">
                            <TableCell colSpan={row.getVisibleCells().length} className="p-0 border-l-4 border-primary">
                                <div className="p-6 bg-card/60 backdrop-blur-sm">
                                    <div className="flex flex-col md:flex-row gap-8">
                                        {row.original.imageUrl && (
                                            <div className="shrink-0">
                                                <div className="relative group cursor-zoom-in">
                                                    <img 
                                                        src={row.original.imageUrl} 
                                                        alt="Receipt" 
                                                        className="w-32 h-44 object-cover rounded-xl shadow-lg border-2 border-border transition-transform group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl" />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex-1 flex flex-col gap-6">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm px-4">
                                                <div>
                                                    <p className="text-muted-foreground mb-1">Ngày mua</p>
                                                    <p className="font-semibold">{format(new Date(row.original.date), 'dd/MM/yyyy')}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground mb-1">Người mua - Nơi nhận</p>
                                                    <p className="font-semibold">
                                                        {row.original.buyer} - {[...new Set(row.original.items.map(it => it.receivingPlace))].join(', ')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground mb-1">Loại</p>
                                                    <Badge variant="outline" className="font-bold">{row.original.category}</Badge>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground mb-1">Tổng cộng</p>
                                                    <p className="font-bold text-lg text-primary">{currencyFormatter(row.original.grandTotal)}</p>
                                                </div>
                                            </div>
                                            
                                            <Separator className="bg-border/40" />
                                            
                                            <div className="px-4">
                                                <h4 className="text-sm font-bold mb-3 uppercase tracking-wider text-muted-foreground">Chi tiết sản phẩm</h4>
                                                <div className="rounded-xl border border-border shadow-sm overflow-hidden bg-background">
                                                    <Table>
                                                        <TableHeader className="bg-muted/30">
                                                            <TableRow className="hover:bg-transparent border-none">
                                                                <TableHead className="h-9 text-xs">Sản phẩm</TableHead>
                                                                <TableHead className="h-9 text-xs">Nơi nhận</TableHead>
                                                                <TableHead className="h-9 text-xs text-right">SL</TableHead>
                                                                <TableHead className="h-9 text-xs text-right">Đơn giá</TableHead>
                                                                <TableHead className="h-9 text-xs text-right">Tổng</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {row.original.items.map((item, idx) => (
                                                                <TableRow key={idx} className="border-border/30 last:border-0 hover:bg-muted/20">
                                                                    <TableCell className="py-2.5 text-sm font-medium">{item.productName}</TableCell>
                                                                    <TableCell className="py-2.5 text-sm text-muted-foreground">{item.receivingPlace}</TableCell>
                                                                    <TableCell className="py-2.5 text-sm text-right font-semibold">{item.quantity}</TableCell>
                                                                    <TableCell className="py-2.5 text-sm text-right text-muted-foreground">{currencyFormatter(item.price)}</TableCell>
                                                                    <TableCell className="py-2.5 text-sm text-right font-bold text-primary">{currencyFormatter(item.total)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không có kết quả.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} hóa đơn.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
