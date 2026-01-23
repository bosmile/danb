
'use client';
import { ProductSerializable } from "@/types";
import { ProductCard } from "./product-card";

export function ProductList({ products, onDataChanged }: { products: ProductSerializable[]; onDataChanged: () => void }) {
    return (
        <div className="space-y-3">
            {products.length > 0 ? products.map(product => (
                <ProductCard key={product.id} product={product} onDataChanged={onDataChanged} />
            )) : (
                <div className="text-center text-muted-foreground py-10">Không có sản phẩm nào.</div>
            )}
        </div>
    )
}
