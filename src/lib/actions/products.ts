'use server';

import { Timestamp } from 'firebase/firestore';
import type { Product, ProductSerializable } from '@/types';
import { revalidatePath } from 'next/cache';

let mockProducts: Product[] = [
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
    await new Promise(resolve => setTimeout(resolve, 200));
    return [...mockProducts].sort((a,b) => a.name.localeCompare(b.name)).map(serializeProduct);
}

export async function addProduct(productData: { name: string }): Promise<{success: boolean, newProduct?: ProductSerializable, error?: string}> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const existingProduct = mockProducts.find(p => p.name.toLowerCase() === productData.name.toLowerCase());
    if (existingProduct) {
        return { success: false, error: `Sản phẩm "${productData.name}" đã tồn tại.` };
    }
    
    const newProduct: Product = { 
        id: String(Date.now()), 
        name: productData.name, 
        createdAt: Timestamp.now() 
    };

    mockProducts.push(newProduct);
    revalidatePath('/products');
    revalidatePath('/invoices/add');
    return { success: true, newProduct: serializeProduct(newProduct) };
}

export async function updateProduct(id: string, productData: { name: string }): Promise<{success: boolean, error?: string}> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
        // Check for name conflict before updating
        const existingProduct = mockProducts.find(p => p.name.toLowerCase() === productData.name.toLowerCase() && p.id !== id);
        if (existingProduct) {
            return { success: false, error: `Sản phẩm "${productData.name}" đã tồn tại.` };
        }
        mockProducts[index].name = productData.name;
        revalidatePath('/products');
        return { success: true };
    }
    return { success: false, error: 'Product not found' };
}

export async function deleteProduct(id: string): Promise<{success: boolean, error?: string}> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const initialLength = mockProducts.length;
    mockProducts = mockProducts.filter(p => p.id !== id);
    if (mockProducts.length < initialLength) {
        revalidatePath('/products');
        return { success: true };
    }
    return { success: false, error: 'Product not found' };
}
