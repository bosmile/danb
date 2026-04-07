'use server';

import { revalidatePath } from 'next/cache';
import type { PaymentSerializable, InvoiceSerializable, PaymentTransactionSerializable } from '@/types';
import { getInvoices } from './invoices';
import * as db from '@/lib/db';

const COLLECTION = 'payments';

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
        if (a.productName < b.productName) return -1;
        if (a.productName > b.productName) return 1;
        return 0;
    });

    return { reportData, grandTotal };
};

export async function getPayments(): Promise<PaymentSerializable[]> {
    const items = await db.readCollection<PaymentSerializable>(COLLECTION);
    return items.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
}

export async function createPaymentForPeriod(startDate: Date, endDate: Date): Promise<{ success: boolean; newPayment?: PaymentSerializable; error?: string }> {
    try {
        const { reportData, grandTotal } = await generateReportSnapshot(startDate, endDate);

        if (reportData.length === 0) {
            return { success: false, error: 'Không có dữ liệu trong khoảng thời gian đã chọn để tạo kỳ thanh toán.' };
        }

        const newPayment: PaymentSerializable = {
            id: crypto.randomUUID(),
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalAmount: grandTotal,
            reportSnapshot: JSON.stringify(reportData),
            createdAt: new Date().toISOString(),
            transactions: [],
        };

        await db.addItem(COLLECTION, newPayment);

        revalidatePath('/payments');
        return { success: true, newPayment };
    } catch (e: any) {
        console.error("Error creating payment period: ", e);
        return { success: false, error: e.message || "Không thể tạo kỳ thanh toán local." };
    }
}

export async function addTransactionToPayment(
    paymentId: string,
    transactionData: { amount: number; date: Date; }
): Promise<{ success: boolean; error?: string; newRemainingAmount?: number }> {
    try {
        const payment = await db.getItemById<PaymentSerializable>(COLLECTION, paymentId);

        if (!payment) {
            throw new Error('Không tìm thấy kỳ thanh toán.');
        }

        const newTransaction: PaymentTransactionSerializable = {
            id: crypto.randomUUID(),
            date: transactionData.date.toISOString(),
            amount: transactionData.amount,
        };

        const updatedTransactions = [...(payment.transactions || []), newTransaction];
        await db.updateItem<PaymentSerializable>(COLLECTION, paymentId, { transactions: updatedTransactions });

        const paidAmount = updatedTransactions.reduce((acc, t) => acc + t.amount, 0);
        const newRemainingAmount = payment.totalAmount - paidAmount;
        
        revalidatePath('/payments');
        return { success: true, newRemainingAmount };

    } catch(e: any) {
        return { success: false, error: e.message || 'Không thể thêm thanh toán local.' };
    }
}

export async function deleteTransaction(paymentId: string, transactionId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const payment = await db.getItemById<PaymentSerializable>(COLLECTION, paymentId);
        if (!payment) {
            throw new Error('Không tìm thấy kỳ thanh toán.');
        }
        
        const updatedTransactions = (payment.transactions || []).filter(t => t.id !== transactionId);

        await db.updateItem<PaymentSerializable>(COLLECTION, paymentId, { transactions: updatedTransactions });
        
        revalidatePath('/payments');
        return { success: true };

    } catch (e: any) {
        return { success: false, error: e.message || 'Không thể xóa thanh toán local.' };
    }
}

export async function deletePayment(id: string): Promise<{ success: boolean, error?: string }> {
     try {
        await db.deleteItem(COLLECTION, id);
        revalidatePath('/payments');
        return { success: true };
    } catch (e: any) {
        console.error("Error deleting payment: ", e);
        return { success: false, error: "Không thể xóa kỳ thanh toán local." };
    }
}

export async function updatePayment(id: string, data: Partial<PaymentSerializable>): Promise<{ success: boolean, error?: string }> {
    try {
        await db.updateItem<PaymentSerializable>(COLLECTION, id, data);
        revalidatePath('/payments');
        return { success: true };
    } catch (e: any) {
        console.error("Error updating payment: ", e);
        return { success: false, error: "Không thể cập nhật kỳ thanh toán local." };
    }
}
