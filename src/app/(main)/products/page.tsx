'use client';
import { PageHeader } from '@/components/shared/page-header';
import { ProductTable } from '@/components/products/product-table';
import { getProducts } from '@/lib/actions/products';
import { useEffect, useState } from 'react';
import { ProductSerializable } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductFormModal } from '@/components/products/product-form-modal';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductSerializable[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
      setLoading(true);
      const freshProducts = await getProducts();
      setProducts(freshProducts);
      setLoading(false);
  }

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="space-y-6">
       <PageHeader 
        title="Danh sách hàng hóa" 
        description="Quản lý danh sách các sản phẩm có sẵn trong hệ thống."
       >
        <ProductFormModal onProductAdded={refreshData}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm sản phẩm
            </Button>
        </ProductFormModal>
       </PageHeader>

      {loading ? (
        <div className="space-y-4">
            <div className="flex items-center justify-between py-4">
                <Skeleton className="h-10 w-1/3" />
            </div>
            <Skeleton className="h-60 w-full rounded-lg" />
        </div>
      ) : (
        <ProductTable data={products} onDataChanged={refreshData} />
      )}
    </div>
  );
}
