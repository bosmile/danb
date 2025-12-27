'use server';

import {
  Timestamp,
} from 'firebase/firestore';
import type { Invoice, InvoiceSerializable } from '@/types';
import { revalidatePath } from 'next/cache';

// MOCK DATA for demonstration without real Firebase connection
let mockInvoices: Invoice[] = [
  { id: '1', date: Timestamp.fromDate(new Date('2024-05-10')), category: 'BIGC', productName: 'Sữa tươi Vinamilk', quantity: 2, price: 30000, total: 60000, imageUrl: 'https://picsum.photos/seed/101/400/600', createdAt: Timestamp.now() },
  { id: '2', date: Timestamp.fromDate(new Date('2024-05-12')), category: 'SPLZD', productName: 'Tai nghe Sony', quantity: 1, price: 1200000, total: 1200000, imageUrl: 'https://picsum.photos/seed/102/400/600', createdAt: Timestamp.now() },
  { id: '3', date: Timestamp.fromDate(new Date('2024-05-15')), category: 'OTHER', productName: 'Giấy A4', quantity: 5, price: 65000, total: 325000, imageUrl: 'https://picsum.photos/seed/103/400/600', createdAt: Timestamp.now() },
  { id: '4', date: Timestamp.fromDate(new Date('2024-06-02')), category: 'BIGC', productName: 'Bánh mì', quantity: 3, price: 5000, total: 15000, createdAt: Timestamp.now() },
  { id: '5', date: Timestamp.fromDate(new Date('2024-06-05')), category: 'SPLZD', productName: 'Chuột Logitech', quantity: 1, price: 750000, total: 750000, imageUrl: 'https://picsum.photos/seed/104/400/600', createdAt: Timestamp.now() },
];

function serializeInvoice(invoice: Invoice): InvoiceSerializable {
    return {
        ...invoice,
        date: invoice.date.toDate().toISOString(),
        createdAt: invoice.createdAt.toDate().toISOString(),
    };
}


export async function getInvoices(startDate?: Date, endDate?: Date): Promise<InvoiceSerializable[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  let filteredInvoices = [...mockInvoices].sort((a, b) => b.date.toMillis() - a.date.toMillis());
  
  if (startDate) {
    const startTimestamp = Timestamp.fromDate(startDate).toMillis();
    filteredInvoices = filteredInvoices.filter(inv => inv.date.toMillis() >= startTimestamp);
  }
  if (endDate) {
    const endTimestamp = Timestamp.fromDate(endDate).toMillis();
    filteredInvoices = filteredInvoices.filter(inv => inv.date.toMillis() <= endTimestamp);
  }

  return filteredInvoices.map(serializeInvoice);
}

export async function addInvoice(invoiceData: Omit<Invoice, 'id' | 'total' | 'createdAt'>) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const total = invoiceData.quantity * invoiceData.price;
  const newInvoice: Invoice = {
    ...invoiceData,
    id: String(Date.now()),
    total,
    date: Timestamp.fromDate(invoiceData.date as any),
    createdAt: Timestamp.now(),
  };
  mockInvoices.unshift(newInvoice);
  revalidatePath('/');
  revalidatePath('/reports');
  return { success: true };
}

export async function updateInvoice(id: string, invoiceData: Partial<Omit<Invoice, 'id' | 'total' | 'createdAt'>>) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockInvoices.findIndex(inv => inv.id === id);
  if (index !== -1) {
    const originalInvoice = mockInvoices[index];
    const updatedData = { ...originalInvoice, ...invoiceData };
    const total = updatedData.quantity * updatedData.price;
    mockInvoices[index] = { ...updatedData, total, date: Timestamp.fromDate(updatedData.date as any) };
    revalidatePath('/');
    revalidatePath('/reports');
    revalidatePath(`/invoices/${id}/edit`);
    return { success: true };
  }
  return { success: false, error: 'Invoice not found' };
}

export async function deleteInvoice(id: string) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const initialLength = mockInvoices.length;
  mockInvoices = mockInvoices.filter(inv => inv.id !== id);
  if (mockInvoices.length < initialLength) {
    revalidatePath('/');
    revalidatePath('/reports');
    return { success: true };
  }
  return { success: false, error: 'Invoice not found' };
}
