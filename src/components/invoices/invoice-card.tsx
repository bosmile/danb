'use client';
import type { InvoiceSerializable } from '@/types';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

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
  const places = [...new Set(invoice.items.map(item => item.receivingPlace))];
  const placeText = places.length === 0 ? '' : places.length === 1 ? places[0] : 'Nhiều nơi';
  
  return (
    <div className="bg-card p-4 rounded-2xl shadow-sm border border-border active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <CategoryBadge category={invoice.category} />
          <span className="text-xs text-slate-400 font-medium">{format(new Date(invoice.date), 'dd/MM/yyyy')}</span>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-6 w-6 p-0 text-slate-400">
                    <MoreHorizontal className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={`/invoices/${invoice.id}/edit`}>Sửa</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDelete(invoice.id)}>
                  Xóa
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
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
  );
}
