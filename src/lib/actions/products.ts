'use server';

import { Timestamp, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDoc } from 'firebase/firestore';
import type { Product, ProductSerializable } from '@/types';
import { revalidatePath } from 'next/cache';
import { getUnauthenticatedFirestore } from '@/firebase/config';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


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
    const productsCol = collection(db, 'products');
    const q = query(productsCol, orderBy('name'));
    const productSnapshot = await getDocs(q);
    const productList = productSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
    return productList.map(serializeProduct);
}

export async function addProduct(productData: { name: string }): Promise<{success: boolean, newProduct?: ProductSerializable, error?: string}> {
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
}

export async function updateProduct(id: string, productData: { name: string }): Promise<{success: boolean, error?: string}> {
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
}

export async function deleteProduct(id: string): Promise<{success: boolean, error?: string}> {
    const db = await getDb();
    
    // Check if product is used in any invoices
    const invoicesQuery = query(collection(db, 'invoices'), where('productName', '==', (await getDoc(doc(db, 'products', id))).data()?.name));
    const invoicesSnapshot = await getDocs(invoicesQuery);
    if (!invoicesSnapshot.empty) {
        return { success: false, error: 'Không thể xóa sản phẩm đang được sử dụng trong hóa đơn.' };
    }

    const productRef = doc(db, 'products', id);
    deleteDocumentNonBlocking(productRef);

    revalidatePath('/products');
    return { success: true };
}
