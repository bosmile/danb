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
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || '');
  const debouncedInputValue = useDebounce(inputValue, 300);
  const { toast } = useToast();
  const [allProducts, setAllProducts] = React.useState<ProductSerializable[]>([]);

  React.useEffect(() => {
    async function fetchAllProducts() {
      setIsLoading(true);
      const products = await getProducts();
      setAllProducts(products);
      setSuggestions(products.map(p => p.name));
      setIsLoading(false);
    }
    fetchAllProducts();
  }, []);

  React.useEffect(() => {
    if (debouncedInputValue) {
      const filtered = allProducts
        .map(p => p.name)
        .filter(name => name.toLowerCase().includes(debouncedInputValue.toLowerCase()));
      setSuggestions(filtered);
    } else {
      setSuggestions(allProducts.map(p => p.name));
    }
  }, [debouncedInputValue, allProducts]);

  const handleSelect = (currentValue: string) => {
    const selectedProductName = allProducts.find(p => p.name.toLowerCase() === currentValue.toLowerCase())?.name || currentValue;
    setInputValue(selectedProductName);
    onValueChange(selectedProductName);
    setOpen(false);
  };
  
  const handleCreateNew = async () => {
    if (!inputValue) return;
    
    setIsLoading(true);
    try {
      const result = await addProduct({ name: inputValue });
      if (result.success && result.newProduct) {
        const newProduct = result.newProduct;
        setInputValue(newProduct.name);
        onValueChange(newProduct.name);
        
        const updatedProducts = await getProducts();
        setAllProducts(updatedProducts);
        toast({ title: 'Thành công', description: `Đã tạo sản phẩm mới: ${newProduct.name}` });
      } else {
        throw new Error('Failed to create product');
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tạo sản phẩm mới.' });
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };

  const showCreateNew = !isLoading && inputValue && !suggestions.some(s => s.toLowerCase() === inputValue.toLowerCase());

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
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {isLoading && !allProducts.length ? (
              <div className="p-2 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
                <>
                    {suggestions.length === 0 && !showCreateNew && (
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
                        value={`create_new_${inputValue}`}
                        >
                        <Check className={cn('mr-2 h-4 w-4', 'opacity-0')} />
                        Tạo mới "{inputValue}"
                        </CommandItem>
                    )}
                    </CommandGroup>
                </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
