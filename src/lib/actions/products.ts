'use server';

import { collection, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, ProductSerializable } from '@/types';

const mockProducts: Product[] = [
    { id: '1', name: 'Sữa tươi Vinamilk', createdAt: Timestamp.now() },
    { id: '2', name: 'Tai nghe Sony', createdAt: Timestamp.now() },
    { id: '3', name: 'Giấy A4', createdAt: Timestamp.now() },
    { id: '4', name: 'Bánh mì', createdAt: Timestamp.now() },
    { id: '5', name: 'Chuột Logitech', createdAt: Timestamp.now() },
];

function serializeProduct(product: Product): ProductSerializable {
    return {
        ...product,
        createdAt: product.createdAt.toDate().toISOString(),
    };
}


export async function getProducts(): Promise<ProductSerializable[]> {
    // const productsCol = collection(db, 'products');
    // const snapshot = await getDocs(productsCol);
    // const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    // return products.map(serializeProduct);
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProducts.map(serializeProduct);
}

export async function addProduct(productData: { name: string }): Promise<{success: boolean, newProduct?: ProductSerializable, error?: string}> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const existingProduct = mockProducts.find(p => p.name.toLowerCase() === productData.name.toLowerCase());
    if (existingProduct) {
        return { success: false, error: `Sản phẩm "${productData.name}" đã tồn tại.` };
    }
    
    const newProduct: Product = { 
        id: String(mockProducts.length + 1), 
        name: productData.name, 
        createdAt: Timestamp.now() 
    };

    mockProducts.push(newProduct);
    return { success: true, newProduct: serializeProduct(newProduct) };
}
