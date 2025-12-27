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
import { getProductSuggestions, addProduct, getProducts } from '@/lib/actions/products';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import type { ProductSerializable } from '@/types';

interface ProductAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ProductAutocomplete({ value, onValueChange }: ProductAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const debouncedInputValue = useDebounce(value, 300);
  const { toast } = useToast();
  const [allProducts, setAllProducts] = React.useState<ProductSerializable[]>([]);

  React.useEffect(() => {
    async function fetchAllProducts() {
      const products = await getProducts();
      setAllProducts(products);
    }
    fetchAllProducts();
  }, []);

  React.useEffect(() => {
    if (debouncedInputValue) {
      setIsLoading(true);
      const filtered = allProducts
        .map(p => p.name)
        .filter(name => name.toLowerCase().includes(debouncedInputValue.toLowerCase()));
      setSuggestions(filtered);
      setIsLoading(false);
    } else {
      setSuggestions(allProducts.map(p => p.name));
    }
  }, [debouncedInputValue, allProducts]);

  const handleSelect = async (currentValue: string) => {
    onValueChange(currentValue);
    setOpen(false);
  };
  
  const handleCreateNew = async () => {
    if (!value) return;
    
    setIsLoading(true);
    try {
      const result = await addProduct({ name: value });
      if (result.success && result.newProduct) {
        onValueChange(result.newProduct.name);
        // Refresh product list
        const updatedProducts = await getProducts();
        setAllProducts(updatedProducts);
        toast({ title: 'Thành công', description: `Đã tạo sản phẩm mới: ${result.newProduct.name}` });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tạo sản phẩm mới.' });
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };

  const showCreateNew = !isLoading && value && !suggestions.some(s => s.toLowerCase() === value.toLowerCase());

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
            value={value}
            onValueChange={onValueChange}
          />
          <CommandList>
            {isLoading && (
              <div className="p-2 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!isLoading && !suggestions.length && !showCreateNew && (
                <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
            )}
            <CommandGroup>
              {suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion}
                  value={suggestion}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === suggestion ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {suggestion}
                </CommandItem>
              ))}
              {showCreateNew && (
                <CommandItem
                  onSelect={handleCreateNew}
                  value={`create_new_${value}`}
                >
                  <Check className={cn('mr-2 h-4 w-4', 'opacity-0')} />
                  Tạo mới "{value}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
