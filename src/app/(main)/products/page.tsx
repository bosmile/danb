'use client';
import { PageHeader } from '@/components/shared/page-header';
import { ProductTable } from '@/components/products/product-table';
import { getProducts } from '@/lib/actions/products';
import { useEffect, useState } from 'react';
import { ProductSerializable } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductFormModal } from '@/components/products/product-form-modal';
import { Button } from '@/components/ui/button';
import { Plus, PlusCircle, Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProductList } from '@/components/products/product-list';
import { Input } from '@/components/ui/input';

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductSerializable[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductSerializable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();

  const refreshData = async () => {
      setLoading(true);
      try {
        const freshProducts = await getProducts();
        setProducts(freshProducts);
      } finally {
        setLoading(false);
      }
  }

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = products.filter(product => 
      product.name.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredProducts(filteredData);
  }, [searchTerm, products]);

  return (
    <div className="space-y-6">
       <PageHeader 
        title="Danh sách hàng hóa" 
        description="Quản lý danh sách các sản phẩm có sẵn trong hệ thống."
       >
        <div className="hidden md:flex">
            <ProductFormModal onProductAdded={refreshData}>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Thêm sản phẩm
                </Button>
            </ProductFormModal>
        </div>
       </PageHeader>
        
        {isMobile && (
             <ProductFormModal onProductAdded={refreshData}>
                <Button className="md:hidden fixed bottom-24 right-4 z-30 bg-primary text-white flex items-center gap-2 px-4 py-3 h-auto rounded-full shadow-lg shadow-primary/30 active:scale-95 transition-all">
                    <Plus className="h-5 w-5"/>
                    <span className="font-semibold text-sm">Thêm sản phẩm</span>
                </Button>
            </ProductFormModal>
        )}

      {loading ? (
        <>
            <div className="space-y-4 md:hidden">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
            </div>
            <div className="hidden md:block space-y-4">
                 <div className="flex items-center py-4">
                    <Skeleton className="h-10 w-1/3" />
                </div>
                <Skeleton className="h-60 w-full rounded-lg" />
            </div>
        </>
      ) : (
        <>
            <div className="relative md:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input 
                    className="w-full pl-10 pr-4 py-3 bg-card border-none rounded-xl shadow-sm ring-1 ring-border focus:ring-2 focus:ring-primary text-sm transition-all outline-none" 
                    placeholder="Lọc sản phẩm..." 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="hidden md:block">
                 <ProductTable data={products} onDataChanged={refreshData} />
            </div>
             <div className="md:hidden">
                <ProductList products={filteredProducts} onDataChanged={refreshData} />
                 <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600 font-medium uppercase tracking-widest">
                    {filteredProducts.length > 0 ? `Hiển thị ${filteredProducts.length} sản phẩm` : 'Không tìm thấy sản phẩm'}
                </div>
            </div>
        </>
      )}
    </div>
  );
}
