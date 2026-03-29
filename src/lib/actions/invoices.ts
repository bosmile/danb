'use server';

import { revalidatePath } from 'next/cache';
import type { InvoiceSerializable } from '@/types';
import * as db from '@/lib/db';
import { supabase } from '@/lib/db';
import { saveImage, deleteImage } from '@/lib/storage';

const COLLECTION = 'invoices';

export async function getInvoices(startDate?: Date, endDate?: Date): Promise<InvoiceSerializable[]> {
  try {
    let query = supabase.from(COLLECTION).select('*');
    
    if (startDate) {
      query = query.gte('date', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('date', endDate.toISOString());
    }

    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(item => db.fromDB(item)) as InvoiceSerializable[];
  } catch (err) {
    console.error("Error in getInvoices action:", err);
    throw err;
  }
}

export async function getInvoiceById(id: string): Promise<InvoiceSerializable | null> {
    return await db.getItemById<InvoiceSerializable>(COLLECTION, id);
}

export async function addInvoice(invoiceData: any): Promise<{success: boolean, id?: string, error?: string}> {
  try {
    const id = crypto.randomUUID();
    const grandTotal = invoiceData.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    
    let imageUrl = 'https://picsum.photos/seed/placeholder/400/600';
    if (invoiceData.image) {
        imageUrl = await saveImage(invoiceData.image);
    }

    const newInvoice: InvoiceSerializable = {
      ...invoiceData,
      id,
      grandTotal,
      imageUrl,
      date: new Date(invoiceData.date).toISOString(),
      createdAt: new Date().toISOString(),
    };

    await db.addItem(COLLECTION, newInvoice);
    
    revalidatePath('/');
    revalidatePath('/reports');
    return { success: true, id };
  } catch (error) {
    console.error("Error adding invoice: ", error);
    return { success: false, error: "Không thể thêm hóa đơn local. Vui lòng thử lại." };
  }
}

export async function updateInvoice(id: string, invoiceData: any): Promise<{success: boolean, error?: string}> {
  try {
    const existing = await db.getItemById<InvoiceSerializable>(COLLECTION, id);
    if (!existing) throw new Error("Invoice not found");

    const updateData: any = { ...invoiceData };
    
    if (invoiceData.items) {
        updateData.grandTotal = invoiceData.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    }

    if (invoiceData.date) {
        updateData.date = new Date(invoiceData.date).toISOString();
    }

    if (invoiceData.image) {
        if (existing.imageUrl && existing.imageUrl.includes('invoices')) {
            await deleteImage(existing.imageUrl);
        }
        updateData.imageUrl = await saveImage(invoiceData.image);
        delete updateData.image;
    }

    await db.updateItem(COLLECTION, id, updateData);

    revalidatePath('/');
    revalidatePath('/reports');
    revalidatePath(`/invoices/${id}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Error updating invoice: ", error);
    return { success: false, error: "Không thể cập nhật hóa đơn local. Vui lòng thử lại." };
  }
}

export async function deleteInvoice(id: string): Promise<{success: boolean, error?: string}> {
  try {
    const existing = await db.getItemById<InvoiceSerializable>(COLLECTION, id);
    if (existing?.imageUrl && existing.imageUrl.includes('invoices')) {
        await deleteImage(existing.imageUrl);
    }
    
    await db.deleteItem(COLLECTION, id);

    revalidatePath('/');
    revalidatePath('/reports');
    return { success: true };
  } catch (error) {
    console.error("Error deleting invoice: ", error);
    return { success: false, error: "Không thể xóa hóa đơn local. Vui lòng thử lại." };
  }
}
