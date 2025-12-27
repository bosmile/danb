'use client';
import { PageHeader } from '@/components/shared/page-header';
import { ProductTable } from '@/components/products/product-table';
import { getProducts } from '@/lib/actions/products';
import { useEffect, useState } from 'react';
import { ProductSerializable } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductSerializable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const prods = await getProducts();
      setProducts(prods);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const refreshData = async () => {
      setLoading(true);
      const freshProducts = await getProducts();
      setProducts(freshProducts);
      setLoading(false);
  }

  if (loading) {
      return (
          <div className="space-y-6">
               <div className="flex items-center justify-between py-4">
                  <Skeleton className="h-10 w-1/3" />
                  <Skeleton className="h-10 w-32" />
               </div>
               <Skeleton className="h-40 w-full" />
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <ProductTable data={products} onDataChanged={refreshData} />
    </div>
  );
}
