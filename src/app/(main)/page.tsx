'use client';

import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default function DashboardPage() {
  // Data fetching will now be handled client-side in DashboardClient
  return <DashboardClient />;
}
