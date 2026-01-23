'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, Banknote } from 'lucide-react';

type StatsCardsProps = {
  totalSpend: number;
  totalItems: number;
};

export function StatsCards({ totalSpend, totalItems }: StatsCardsProps) {
  return (
    <div className="grid gap-3 grid-cols-2 w-full">
      <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Tổng chi tiêu</span>
            <Banknote className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-xl font-bold text-foreground">
            {new Intl.NumberFormat('vi-VN').format(totalSpend)} <span className="text-sm font-normal underline">đ</span>
        </div>
      </div>
      <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Tổng sản phẩm</span>
            <Package className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-xl font-bold text-foreground">{totalItems}</div>
      </div>
    </div>
  );
}
