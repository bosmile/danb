'use client';

import type { PaymentSerializable } from "@/types";
import { PaymentCard } from "./payment-card";

interface PaymentsListProps {
  data: PaymentSerializable[];
  onDataChanged: () => void;
}

export function PaymentsList({ data, onDataChanged }: PaymentsListProps) {
  return (
    <div className="space-y-4">
      {data.length > 0 ? (
        data.map((payment) => (
          <PaymentCard key={payment.id} payment={payment} onDataChanged={onDataChanged} />
        ))
      ) : (
        <div className="text-center text-muted-foreground py-10">
          Không có kỳ thanh toán nào.
        </div>
      )}
    </div>
  );
}
