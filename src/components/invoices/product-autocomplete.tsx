'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { addProduct, getProducts } from '@/lib/actions/products';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import type { ProductSerializable } from '@/types';

interface ProductAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ProductAutocomplete({ value, onValueChange }: ProductAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [allProducts, setAllProducts] = React.useState<ProductSerializable[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { toast } = useToast();
  
  React.useEffect(() => {
    async function fetchAllProducts() {
      setIsLoading(true);
      try {
        const products = await getProducts();
        setAllProducts(products);
      } catch (e) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tải danh sách sản phẩm.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllProducts();
  }, [toast]);
  
  const filteredProducts = React.useMemo(() => {
    if (!debouncedSearch) {
      return allProducts;
    }
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [debouncedSearch, allProducts]);


  const handleSelect = (productName: string) => {
    onValueChange(productName);
    setSearch('');
    setOpen(false);
  };
  
  const handleCreateNew = async () => {
    if (!search) return;
    
    setIsLoading(true);
    try {
      const result = await addProduct({ name: search });
      if (result.success && result.newProduct) {
        const newProduct = result.newProduct;
        setAllProducts(prev => [...prev, newProduct]);
        onValueChange(newProduct.name);
        toast({ title: 'Thành công', description: `Đã tạo sản phẩm mới: ${newProduct.name}` });
      } else {
        throw new Error(result.error || 'Failed to create product');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Lỗi', description: e.message || 'Không thể tạo sản phẩm mới.' });
    } finally {
      setIsLoading(false);
      setSearch('');
      setOpen(false);
    }
  };

  const showCreateNew = !isLoading && search && !filteredProducts.some(p => p.name.toLowerCase() === search.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || 'Chọn hoặc tạo sản phẩm...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Tìm sản phẩm..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && filteredProducts.length === 0 ? (
              <div className="p-2 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {showCreateNew ? (
                    <div className="cursor-pointer p-2" onClick={handleCreateNew}>Tạo mới "{search}"</div>
                  ) : (
                    "Không tìm thấy sản phẩm."
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.name}
                      onSelect={() => handleSelect(product.name)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === product.name ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {product.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {showCreateNew && (
                  <CommandItem
                    onSelect={handleCreateNew}
                    value={`create_new_${search}`}
                  >
                    <Check className={cn('mr-2 h-4 w-4', 'opacity-0')} />
                    Tạo mới "{search}"
                  </CommandItem>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
