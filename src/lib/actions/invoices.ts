'use server';

import {
  collection,
  getDocs,
  Timestamp,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Invoice, InvoiceSerializable, InvoiceCategory } from '@/types';

// MOCK DATA for demonstration without real Firebase connection
const mockInvoices: Invoice[] = [
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
  // In a real app, you would use the query below.
  // For now, we filter mock data.
  // const invoicesCol = collection(db, 'invoices');
  // let q = query(invoicesCol, orderBy('date', 'desc'));
  // if (startDate) q = query(q, where('date', '>=', startDate));
  // if (endDate) q = query(q, where('date', '<=', endDate));
  // const snapshot = await getDocs(q);
  // const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
  // return invoices.map(serializeInvoice);

  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredInvoices = mockInvoices;
  if (startDate) {
    filteredInvoices = filteredInvoices.filter(inv => inv.date.toDate() >= startDate);
  }
  if (endDate) {
    filteredInvoices = filteredInvoices.filter(inv => inv.date.toDate() <= endDate);
  }

  return filteredInvoices.map(serializeInvoice);
}

// Other actions would be implemented similarly
export async function addInvoice(invoiceData: Omit<Invoice, 'id' | 'total' | 'createdAt'>) {
  // Real implementation:
  // const total = invoiceData.quantity * invoiceData.price;
  // await addDoc(collection(db, 'invoices'), { ...invoiceData, total, createdAt: Timestamp.now() });
  console.log('Adding invoice:', invoiceData);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
}

export async function updateInvoice(id: string, invoiceData: Partial<Invoice>) {
  console.log('Updating invoice:', id, invoiceData);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
}

export async function deleteInvoice(id: string) {
  console.log('Deleting invoice:', id);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
}
