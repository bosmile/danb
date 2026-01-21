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
  orderBy,
} from 'firebase/firestore';
import { getUnauthenticatedFirestore } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import type { Payment, PaymentSerializable, Invoice } from '@/types';
import { getInvoices } from './invoices'; // We can reuse this

// This function is similar to the logic in ReportsView
const generateReportSnapshot = async (startDate: Date, endDate: Date) => {
    const allInvoicesData = await getInvoices(startDate, endDate);
    const groups: { 
        [key: string]: {
            productName: string;
            category: string;
            totalQuantity: number;
            totalAmount: number;
            detailsByBuyer: {
                [buyer: string]: {
                    quantity: number;
                    quantityByPlace: { [place: string]: number };
                };
            };
        };
    } = {};

    let grandTotal = 0;

    allInvoicesData.forEach(invoice => {
      const items = invoice.items || [];
      grandTotal += invoice.grandTotal;
      
      items.forEach(item => {
        const key = `${item.productName}-${invoice.category}`;

        if (!groups[key]) {
          groups[key] = {
            productName: item.productName,
            category: invoice.category,
            totalQuantity: 0,
            totalAmount: 0,
            detailsByBuyer: {},
          };
        }
        
        const group = groups[key];
        group.totalQuantity += item.quantity;
        group.totalAmount += item.total;
        
        if (!group.detailsByBuyer[invoice.buyer]) {
            group.detailsByBuyer[invoice.buyer] = {
                quantity: 0,
                quantityByPlace: {},
            };
        }

        const buyerDetails = group.detailsByBuyer[invoice.buyer];
        buyerDetails.quantity += item.quantity;

        const place = item.receivingPlace;
        if (!buyerDetails.quantityByPlace[place]) {
            buyerDetails.quantityByPlace[place] = 0;
        }
        buyerDetails.quantityByPlace[place] += item.quantity;
      });
    });

    const reportData = Object.values(groups).sort((a, b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        if (a.productName < a.productName) return -1;
        if (a.productName > b.productName) return 1;
        return 0;
    });

    return { reportData, grandTotal };
};


export async function getPayments(): Promise<PaymentSerializable[]> {
    const db = await getUnauthenticatedFirestore();
    const paymentsCol = collection(db, 'payments');
    const q = query(paymentsCol, orderBy('endDate', 'desc'));
    const snapshot = await getDocs(q);
    const paymentsList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Payment));

    return paymentsList.map(payment => ({
        ...payment,
        startDate: payment.startDate.toDate().toISOString(),
        endDate: payment.endDate.toDate().toISOString(),
        createdAt: payment.createdAt.toDate().toISOString(),
        paidAt: payment.paidAt?.toDate().toISOString(),
    }));
}

export async function createPaymentForPeriod(startDate: Date, endDate: Date): Promise<{ success: boolean, error?: string }> {
    try {
        const db = await getUnauthenticatedFirestore();
        const { reportData, grandTotal } = await generateReportSnapshot(startDate, endDate);

        if (reportData.length === 0) {
            return { success: false, error: 'Không có dữ liệu trong khoảng thời gian đã chọn để tạo kỳ thanh toán.' };
        }

        const newPayment = {
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            isPaid: false,
            totalAmount: grandTotal,
            reportSnapshot: JSON.stringify(reportData),
            createdAt: Timestamp.now(),
        };

        await addDoc(collection(db, 'payments'), newPayment);

        revalidatePath('/payments');
        return { success: true };
    } catch (e: any) {
        console.error("Error creating payment period: ", e);
        return { success: false, error: e.message || "Không thể tạo kỳ thanh toán." };
    }
}

export async function updatePaymentStatus(id: string, isPaid: boolean): Promise<{ success: boolean, error?: string }> {
    try {
        const db = await getUnauthenticatedFirestore();
        const paymentRef = doc(db, 'payments', id);
        
        const updateData: { isPaid: boolean, paidAt?: Timestamp | null } = { isPaid };
        if (isPaid) {
            updateData.paidAt = Timestamp.now();
        } else {
            updateData.paidAt = null;
        }

        await updateDoc(paymentRef, updateData);

        revalidatePath('/payments');
        return { success: true };
    } catch (e: any) {
        console.error("Error updating payment status: ", e);
        return { success: false, error: "Không thể cập nhật trạng thái thanh toán." };
    }
}

export async function deletePayment(id: string): Promise<{ success: boolean, error?: string }> {
     try {
        const db = await getUnauthenticatedFirestore();
        const paymentRef = doc(db, 'payments', id);
        await deleteDoc(paymentRef);

        revalidatePath('/payments');
        return { success: true };
    } catch (e: any) {
        console.error("Error deleting payment: ", e);
        return { success: false, error: "Không thể xóa kỳ thanh toán." };
    }
}
