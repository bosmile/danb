'use server';

import type { ProductSerializable, InvoiceSerializable } from '@/types';
import { revalidatePath } from 'next/cache';
import * as db from '@/lib/db';

const COLLECTION = 'products';
const INVOICES_COLLECTION = 'invoices';

export async function getProducts(): Promise<ProductSerializable[]> {
    // 1. Fetch all invoices to calculate stats
    const invoices = await db.readCollection<InvoiceSerializable>(INVOICES_COLLECTION);

    // 2. Aggregate stats for each product
    const productStats: { [productName: string]: { totalQuantity: number; totalAmount: number } } = {};

    for (const invoice of invoices) {
        for (const item of invoice.items) {
            if (!productStats[item.productName]) {
                productStats[item.productName] = { totalQuantity: 0, totalAmount: 0 };
            }
            productStats[item.productName].totalQuantity += (item.quantity || 0);
            productStats[item.productName].totalAmount += (item.total || 0);
        }
    }

    // 3. Fetch all products
    const productList = await db.readCollection<ProductSerializable>(COLLECTION);

    // 4. Combine product list with stats
    const productsWithStats = productList.map(product => {
        const stats = productStats[product.name] || { totalQuantity: 0, totalAmount: 0 };
        return {
            ...product,
            totalQuantityPurchased: stats.totalQuantity,
            totalAmountSpent: stats.totalAmount,
        };
    });
    
    // Sort by name
    return productsWithStats.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addProduct(productData: { name: string }): Promise<{success: boolean, newProduct?: ProductSerializable, error?: string}> {
    try {
        const products = await db.readCollection<ProductSerializable>(COLLECTION);
        
        if (products.some(p => p.name === productData.name)) {
            return { success: false, error: `Sản phẩm "${productData.name}" đã tồn tại.` };
        }
        
        const newProduct: ProductSerializable = { 
            id: crypto.randomUUID(),
            name: productData.name, 
            createdAt: new Date().toISOString() 
        };

        await db.addItem(COLLECTION, newProduct);
        
        revalidatePath('/products');
        revalidatePath('/invoices/add');
        revalidatePath('/invoices/[id]/edit', 'page');
        return { success: true, newProduct };
    } catch(error: any) {
        console.error("Error adding product:", error);
        return { success: false, error: error.message || "Không thể thêm sản phẩm." };
    }
}

export async function updateProduct(id: string, productData: { name: string }): Promise<{success: boolean, error?: string}> {
    try {
        const products = await db.readCollection<ProductSerializable>(COLLECTION);
        if (products.some(p => p.name === productData.name && p.id !== id)) {
            return { success: false, error: `Sản phẩm "${productData.name}" đã tồn tại.` };
        }
        
        await db.updateItem<ProductSerializable>(COLLECTION, id, { name: productData.name });

        revalidatePath('/products');
        return { success: true };
    } catch(error: any) {
        console.error("Error updating product:", error);
        return { success: false, error: error.message || "Không thể cập nhật sản phẩm." };
    }
}

export async function deleteProduct(id: string): Promise<{success: boolean, error?: string}> {
    try {
        const product = await db.getItemById<ProductSerializable>(COLLECTION, id);
        if (!product) return { success: false, error: 'Sản phẩm không tồn tại.' };

        // Check if in use
        const invoices = await db.readCollection<InvoiceSerializable>(INVOICES_COLLECTION);
        const isProductInUse = invoices.some(inv => 
            inv.items?.some((item: any) => item.productName === product.name)
        );

        if (isProductInUse) {
            return { success: false, error: `"${product.name}" đang được sử dụng và không thể xóa.` };
        }
        
        await db.deleteItem(COLLECTION, id);

        revalidatePath('/products');
        return { success: true };
    } catch (error) {
        console.error("Error deleting product: ", error);
        return { success: false, error: 'Không thể xóa sản phẩm.' };
    }
}
