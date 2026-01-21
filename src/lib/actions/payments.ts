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
  getDoc,
  FieldValue,
} from 'firebase/firestore';
import { getUnauthenticatedFirestore } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import type { Payment, PaymentSerializable, Invoice, PaymentTransaction, PaymentTransactionSerializable } from '@/types';
import { getInvoices } from './invoices';
import { randomUUID } from 'crypto';

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

function serializePayment(payment: Payment): PaymentSerializable {
    return {
        ...payment,
        startDate: payment.startDate.toDate().toISOString(),
        endDate: payment.endDate.toDate().toISOString(),
        createdAt: payment.createdAt.toDate().toISOString(),
        transactions: (payment.transactions || []).map(t => ({
            ...t,
            date: t.date.toDate().toISOString(),
        })),
    };
}


export async function getPayments(): Promise<PaymentSerializable[]> {
    const db = await getUnauthenticatedFirestore();
    const paymentsCol = collection(db, 'payments');
    const q = query(paymentsCol, orderBy('endDate', 'desc'));
    const snapshot = await getDocs(q);
    const paymentsList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Payment));

    return paymentsList.map(serializePayment);
}

export async function createPaymentForPeriod(startDate: Date, endDate: Date): Promise<{ success: boolean; newPayment?: PaymentSerializable; error?: string }> {
    try {
        const db = await getUnauthenticatedFirestore();
        const { reportData, grandTotal } = await generateReportSnapshot(startDate, endDate);

        if (reportData.length === 0) {
            return { success: false, error: 'Không có dữ liệu trong khoảng thời gian đã chọn để tạo kỳ thanh toán.' };
        }

        const newPaymentData = {
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            totalAmount: grandTotal,
            reportSnapshot: JSON.stringify(reportData),
            createdAt: Timestamp.now(),
            transactions: [], // Initialize with empty transactions
        };

        const docRef = await addDoc(collection(db, 'payments'), newPaymentData);

        const newPayment: Payment = {
            id: docRef.id,
            ...newPaymentData
        };

        revalidatePath('/payments');
        return { success: true, newPayment: serializePayment(newPayment) };
    } catch (e: any) {
        console.error("Error creating payment period: ", e);
        return { success: false, error: e.message || "Không thể tạo kỳ thanh toán." };
    }
}

export async function addTransactionToPayment(
    paymentId: string,
    transactionData: { amount: number; date: Date; note?: string }
): Promise<{ success: boolean; error?: string; newRemainingAmount?: number }> {
    try {
        const db = await getUnauthenticatedFirestore();
        const paymentRef = doc(db, 'payments', paymentId);
        const paymentSnap = await getDoc(paymentRef);

        if (!paymentSnap.exists()) {
            throw new Error('Không tìm thấy kỳ thanh toán.');
        }

        const payment = paymentSnap.data() as Payment;
        
        const newTransaction: PaymentTransaction = {
            id: randomUUID(),
            date: Timestamp.fromDate(transactionData.date),
            amount: transactionData.amount,
            note: transactionData.note || '',
        };

        const updatedTransactions = [...(payment.transactions || []), newTransaction];
        await updateDoc(paymentRef, { transactions: updatedTransactions });

        const paidAmount = updatedTransactions.reduce((acc, t) => acc + t.amount, 0);
        const newRemainingAmount = payment.totalAmount - paidAmount;
        
        revalidatePath('/payments');
        return { success: true, newRemainingAmount };

    } catch(e: any) {
        return { success: false, error: e.message || 'Không thể thêm thanh toán.' };
    }
}

export async function deleteTransaction(paymentId: string, transactionId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const db = await getUnauthenticatedFirestore();
        const paymentRef = doc(db, 'payments', paymentId);
        const paymentSnap = await getDoc(paymentRef);

        if (!paymentSnap.exists()) {
            throw new Error('Không tìm thấy kỳ thanh toán.');
        }
        
        const payment = paymentSnap.data() as Payment;
        const updatedTransactions = (payment.transactions || []).filter(t => t.id !== transactionId);

        await updateDoc(paymentRef, { transactions: updatedTransactions });
        
        revalidatePath('/payments');
        return { success: true };

    } catch (e: any) {
        return { success: false, error: e.message || 'Không thể xóa thanh toán.' };
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
