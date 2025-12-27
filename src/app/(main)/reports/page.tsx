'use client';
import { PageHeader } from '@/components/shared/page-header';
import { ReportsClient } from '@/components/reports/reports-client';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo tổng hợp"
        description="Xem báo cáo chi tiết và tổng hợp theo khoảng thời gian."
      />
      <ReportsClient />
    </div>
  );
}
