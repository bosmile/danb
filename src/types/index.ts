import type { Timestamp } from 'firebase/firestore';

export type InvoiceCategory = 'BIGC' | 'SPLZD' | 'OTHER';
export type Buyer = 'Hà' | 'Hằng';
export type ReceivingPlace = 'NĐ' | 'HN';

export interface Product {
  id: string;
  name: string;
  createdAt: Timestamp;
  totalQuantityPurchased?: number;
  totalAmountSpent?: number;
}

export interface InvoiceItem {
  productName: string;
  quantity: number;
  price: number;
  total: number;
  receivingPlace: ReceivingPlace;
}

export interface Invoice {
  id: string;
  date: Timestamp;
  category: InvoiceCategory;
  buyer: Buyer;
  items: InvoiceItem[];
  grandTotal: number;
  imageUrl?: string;
  createdAt: Timestamp;
}

// For client-side rendering where Timestamps are converted to strings or numbers
export type InvoiceSerializable = Omit<Invoice, 'date' | 'createdAt'> & {
  date: string;
  createdAt: string;
};

export type ProductSerializable = Omit<Product, 'createdAt'> & {
  createdAt: string;
};

export interface PaymentTransaction {
  id: string;
  date: Timestamp;
  amount: number;
  note?: string;
}

export type PaymentTransactionSerializable = Omit<PaymentTransaction, 'date'> & {
  date: string;
};

export interface Payment {
  id: string;
  startDate: Timestamp;
  endDate: Timestamp;
  totalAmount: number;
  transactions: PaymentTransaction[];
  reportSnapshot: string; // JSON string of the report data
  createdAt: Timestamp;
}

export type PaymentSerializable = Omit<Payment, 'startDate' | 'endDate' | 'createdAt' | 'transactions'> & {
  startDate: string;
  endDate: string;
  createdAt: string;
  transactions: PaymentTransactionSerializable[];
};
