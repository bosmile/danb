'use server';

import {
  Timestamp,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import type { Invoice, InvoiceSerializable } from '@/types';
import { revalidatePath } from 'next/cache';
import { getUnauthenticatedFirestore } from '@/firebase/config';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';


async function getDb() {
  const db = getUnauthenticatedFirestore();
  return db;
}

function serializeInvoice(invoice: Invoice): InvoiceSerializable {
    return {
        ...invoice,
        date: invoice.date.toDate().toISOString(),
        createdAt: invoice.createdAt.toDate().toISOString(),
    };
}

export async function getInvoices(startDate?: Date, endDate?: Date): Promise<InvoiceSerializable[]> {
  const db = await getDb();
  const invoicesCol = collection(db, 'invoices');
  
  const queries = [orderBy('date', 'desc')];
  if (startDate) {
    queries.push(where('date', '>=', Timestamp.fromDate(startDate)));
  }
  if (endDate) {
    queries.push(where('date', '<=', Timestamp.fromDate(endDate)));
  }

  const q = query(invoicesCol, ...queries);
  const invoiceSnapshot = await getDocs(q);
  const invoiceList = invoiceSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Invoice));
  
  return invoiceList.map(serializeInvoice);
}

export async function getInvoiceById(id: string): Promise<InvoiceSerializable | null> {
    const db = await getDb();
    const invoiceRef = doc(db, 'invoices', id);
    const docSnap = await getDoc(invoiceRef);

    if (docSnap.exists()) {
        return serializeInvoice({ id: docSnap.id, ...docSnap.data() } as Invoice);
    } else {
        return null;
    }
}

export async function addInvoice(invoiceData: Omit<Invoice, 'id' | 'total' | 'createdAt'>) {
  const db = await getDb();
  const total = invoiceData.quantity * invoiceData.price;
  const newInvoice = {
    ...invoiceData,
    date: Timestamp.fromDate(invoiceData.date as any),
    total,
    createdAt: Timestamp.now(),
    imageUrl: invoiceData.imageUrl || 'https://picsum.photos/seed/placeholder/400/600',
  };

  await addDoc(collection(db, 'invoices'), newInvoice);
  
  revalidatePath('/');
  revalidatePath('/reports');
  return { success: true };
}

export async function updateInvoice(id: string, invoiceData: Partial<Omit<Invoice, 'id' | 'total' | 'createdAt'>>) {
  const db = await getDb();
  const invoiceRef = doc(db, 'invoices', id);

  const docSnap = await getDoc(invoiceRef);
  
  if (!docSnap.exists()) {
      return { success: false, error: 'Invoice not found' };
  }

  const originalInvoice = docSnap.data();
  const updatedData = { ...originalInvoice, ...invoiceData };
  const total = updatedData.quantity * updatedData.price;
  
  await updateDoc(invoiceRef, { ...invoiceData, date: Timestamp.fromDate(invoiceData.date as any), total });

  revalidatePath('/');
  revalidatePath('/reports');
  revalidatePath(`/invoices/${id}/edit`);
  return { success: true };
}

export async function deleteInvoice(id: string) {
  const db = await getDb();
  const invoiceRef = doc(db, 'invoices', id);
  await deleteDoc(invoiceRef);

  revalidatePath('/');
  revalidatePath('/reports');
  return { success: true };
}
