import { PageHeader } from '@/components/shared/page-header';
import { ProductTable } from '@/components/products/product-table';
import { getProducts } from '@/lib/actions/products';

export const revalidate = 0; // Revalidate data on every request

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      <ProductTable data={products} />
    </div>
  );
}
