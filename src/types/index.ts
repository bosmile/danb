import type { Timestamp } from 'firebase/firestore';

export type InvoiceCategory = 'BIGC' | 'SPLZD' | 'OTHER';
export type Buyer = 'Hà' | 'Hằng';
export type ReceivingPlace = 'NĐ' | 'HN';

export interface Product {
  id: string;
  name: string;
  createdAt: Timestamp;
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
  notes?: string;
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
