'use client';
import type { InvoiceSerializable } from '@/types';
import { format } from 'date-fns';
import { Edit2, Trash2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Separator } from '../ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';

const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
}

const CategoryBadge = ({ category }: { category: InvoiceSerializable['category'] }) => {
    const text = category === 'OTHER' ? 'Khác' : category;
    const colorClasses = category === 'BIGC' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';

    return <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', colorClasses)}>{text}</span>;
};

export function InvoiceCard({ invoice, onDelete }: { invoice: InvoiceSerializable; onDelete: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const items = invoice.items || [];
  const places = [...new Set(items.map(item => item.receivingPlace))];
  const placeText = places.length === 0 ? '' : places.length === 1 ? places[0] : 'Nhiều nơi';
  
  return (
    <div 
        className={cn(
            "bg-card rounded-2xl shadow-sm border border-border transition-all duration-300 overflow-hidden",
            isExpanded ? "ring-2 ring-primary/20 border-primary/30" : "active:bg-slate-50 dark:active:bg-slate-800/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
    >
        <div className="p-4 cursor-pointer">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <ChevronRight className={cn(
                        "h-4 w-4 transition-transform text-slate-400",
                        isExpanded ? "rotate-90" : "rotate-0"
                    )} />
                    <CategoryBadge category={invoice.category} />
                    <span className="text-xs text-slate-400 font-medium">{format(new Date(invoice.date), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-slate-400 active:bg-slate-100 rounded-full" 
                        asChild
                    >
                        <Link href={`/invoices/${invoice.id}/edit`}>
                            <Edit2 className="h-5 w-5" />
                        </Link>
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-slate-400 active:bg-slate-100 rounded-full" 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(invoice.id);
                        }}
                    >
                        <Trash2 className="h-5 w-5 text-destructive/70" />
                    </Button>
                </div>
            </div>
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-sm font-bold text-foreground mb-0.5">
                        {invoice.items.length === 1 ? invoice.items[0].productName : `${invoice.items.length} sản phẩm`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {invoice.buyer} - {placeText}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-primary font-bold text-lg">{currencyFormatter(invoice.grandTotal)} <span className="text-[10px] font-normal underline">đ</span></p>
                </div>
            </div>
        </div>

        {isExpanded && (
            <div className="px-4 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <Separator className="mb-4 bg-border/40" />
                
                {invoice.imageUrl && (
                    <div className="mb-4">
                        <img 
                            src={invoice.imageUrl} 
                            alt="Receipt" 
                            className="w-full h-48 object-cover rounded-xl shadow-sm border border-border"
                        />
                    </div>
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-[11px] mb-2 px-1">
                        <div>
                            <p className="text-muted-foreground mb-0.5 uppercase tracking-tighter font-bold">Người mua</p>
                            <p className="font-semibold">{invoice.buyer}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-muted-foreground mb-0.5 uppercase tracking-tighter font-bold">Nơi nhận</p>
                            <p className="font-semibold">{placeText}</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border overflow-hidden bg-background/50">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="h-8 text-[10px] py-1 px-3">Sản phẩm</TableHead>
                                    <TableHead className="h-8 text-[10px] py-1 px-3 text-right">Tổng</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.items.map((item, idx) => (
                                    <TableRow key={idx} className="border-border/30 last:border-0 hover:bg-transparent">
                                        <TableCell className="py-2 px-3 text-[11px]">
                                            <div className="font-medium text-foreground">{item.productName}</div>
                                            <div className="text-[10px] text-muted-foreground">{item.quantity} x {new Intl.NumberFormat('vi-VN').format(item.price)}đ</div>
                                        </TableCell>
                                        <TableCell className="py-2 px-3 text-[11px] text-right font-bold text-primary align-top">
                                            {new Intl.NumberFormat('vi-VN').format(item.total)}đ
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    
                    <div className="flex justify-between items-center px-1 pt-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Tổng cộng</span>
                        <span className="text-lg font-black text-primary">{currencyFormatter(invoice.grandTotal)} đ</span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
