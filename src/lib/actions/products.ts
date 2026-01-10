'use server';

import { Timestamp, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDoc } from 'firebase/firestore';
import type { Product, ProductSerializable, Invoice } from '@/types';
import { revalidatePath } from 'next/cache';
import { getUnauthenticatedFirestore } from '@/firebase/config';

async function getDb() {
  return getUnauthenticatedFirestore();
}

function serializeProduct(product: Product): ProductSerializable {
    return {
        ...product,
        createdAt: product.createdAt.toDate().toISOString(),
    };
}

export async function getProducts(): Promise<ProductSerializable[]> {
    const db = await getDb();
    
    // 1. Fetch all invoices to calculate stats
    const invoicesCol = collection(db, 'invoices');
    const invoiceSnapshot = await getDocs(invoicesCol);
    const invoices = invoiceSnapshot.docs.map(doc => doc.data() as Omit<Invoice, 'id' | 'createdAt'>);

    // 2. Aggregate stats for each product
    const productStats: { [productName: string]: { totalQuantity: number; totalAmount: number } } = {};

    for (const invoice of invoices) {
        for (const item of invoice.items) {
            if (!productStats[item.productName]) {
                productStats[item.productName] = { totalQuantity: 0, totalAmount: 0 };
            }
            productStats[item.productName].totalQuantity += item.quantity;
            productStats[item.productName].totalAmount += item.total;
        }
    }

    // 3. Fetch all products
    const productsCol = collection(db, 'products');
    const q = query(productsCol, orderBy('name'));
    const productSnapshot = await getDocs(q);
    const productList = productSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));

    // 4. Combine product list with stats
    const productsWithStats = productList.map(product => {
        const stats = productStats[product.name] || { totalQuantity: 0, totalAmount: 0 };
        return {
            ...serializeProduct(product),
            totalQuantityPurchased: stats.totalQuantity,
            totalAmountSpent: stats.totalAmount,
        };
    });
    
    return productsWithStats;
}

export async function addProduct(productData: { name: string }): Promise<{success: boolean, newProduct?: ProductSerializable, error?: string}> {
    try {
        const db = await getDb();
        const productsCol = collection(db, 'products');
        
        const q = query(productsCol, where('name', '==', productData.name));
        const existingSnapshot = await getDocs(q);
        if (!existingSnapshot.empty) {
            return { success: false, error: `Sản phẩm "${productData.name}" đã tồn tại.` };
        }
        
        const newProductData = { 
            name: productData.name, 
            createdAt: Timestamp.now() 
        };

        const docRef = await addDoc(productsCol, newProductData);
        
        const newProduct: Product = {
            id: docRef.id,
            ...newProductData
        }

        revalidatePath('/products');
        revalidatePath('/invoices/add');
        revalidatePath('/invoices/[id]/edit', 'page');
        return { success: true, newProduct: serializeProduct(newProduct) };
    } catch(error: any) {
        console.error("Error adding product:", error);
        return { success: false, error: error.message || "Không thể thêm sản phẩm." };
    }
}

export async function updateProduct(id: string, productData: { name: string }): Promise<{success: boolean, error?: string}> {
    try {
        const db = await getDb();
        const productRef = doc(db, 'products', id);

        const q = query(collection(db, 'products'), where('name', '==', productData.name));
        const existingSnapshot = await getDocs(q);
        const conflict = existingSnapshot.docs.find(doc => doc.id !== id);
        if (conflict) {
            return { success: false, error: `Sản phẩm "${productData.name}" đã tồn tại.` };
        }
        
        await updateDoc(productRef, { name: productData.name });

        revalidatePath('/products');
        return { success: true };
    } catch(error: any) {
        console.error("Error updating product:", error);
        return { success: false, error: error.message || "Không thể cập nhật sản phẩm." };
    }
}

export async function deleteProduct(id: string): Promise<{success: boolean, error?: string}> {
    try {
        const db = await getDb();
        
        // First, get the name of the product to be deleted.
        const productRef = doc(db, 'products', id);
        const productDoc = await getDoc(productRef);
        if (!productDoc.exists()) {
             return { success: false, error: 'Sản phẩm không tồn tại.' };
        }
        const productName = productDoc.data()?.name;

        // Now, check if this product name is used in any invoices.
        const invoicesCollection = collection(db, 'invoices');
        const q = query(invoicesCollection, where('items', 'array-contains-any', [{ productName: productName }]));
        
        // A more robust query would be to iterate through invoices, but for smaller datasets
        // checking for productName in items array can be an indicator.
        // The most robust check is client side or needs complex queries/functions
        // Simplified check:
        const invoiceQuerySnapshot = await getDocs(collection(db, 'invoices'));
        const isProductInUse = invoiceQuerySnapshot.docs.some(doc => 
            doc.data().items?.some((item: any) => item.productName === productName)
        );

        if (isProductInUse) {
            return { success: false, error: `"${productName}" đang được sử dụng trong một hoặc nhiều hóa đơn và không thể xóa.` };
        }
        
        await deleteDoc(productRef);

        revalidatePath('/products');
        return { success: true };
    } catch (error) {
        console.error("Error deleting product: ", error);
        return { success: false, error: 'Không thể xóa sản phẩm. Vui lòng thử lại.' };
    }
}
