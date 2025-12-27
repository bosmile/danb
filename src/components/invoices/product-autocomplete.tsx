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
  const [isLoading, setIsLoading] = React.useState(true);
  const [inputValue, setInputValue] = React.useState(value || '');
  const debouncedSearch = useDebounce(inputValue, 300);
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

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? '' : currentValue;
    onValueChange(newValue);
    setInputValue(newValue);
    setOpen(false);
  };
  
  const handleCreateNew = async () => {
    if (!inputValue) return;
    
    setIsLoading(true);
    try {
      const result = await addProduct({ name: inputValue });
      if (result.success && result.newProduct) {
        const newProduct = result.newProduct;
        setAllProducts(prev => [...prev, newProduct]);
        onValueChange(newProduct.name);
        setInputValue(newProduct.name);
        toast({ title: 'Thành công', description: `Đã tạo sản phẩm mới: ${newProduct.name}` });
      } else {
        // If product already exists, just select it
        const existing = allProducts.find(p => p.name.toLowerCase() === inputValue.toLowerCase());
        if (existing) {
          onValueChange(existing.name);
          setInputValue(existing.name);
        } else {
           throw new Error(result.error || 'Failed to create product');
        }
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Lỗi', description: e.message || 'Không thể tạo sản phẩm mới.' });
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };

  const showCreateNew = !isLoading && debouncedSearch && !filteredProducts.some(p => p.name.toLowerCase() === debouncedSearch.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {value || 'Chọn hoặc tạo sản phẩm...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Tìm sản phẩm..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {(isLoading && !allProducts.length) && (
              <div className="p-2 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {
              !isLoading && debouncedSearch && filteredProducts.length === 0 && !showCreateNew && (
                <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
              )
            }
            <CommandGroup>
              {filteredProducts.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={handleSelect}
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
                value={`create_new_${debouncedSearch}`}
                className="text-primary cursor-pointer"
              >
                <Check className={cn('mr-2 h-4 w-4', 'opacity-0')} />
                Tạo mới "{debouncedSearch}"
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Add FormControl to exports for use in invoice-form.tsx
import { FormControl } from '@/components/ui/form';
