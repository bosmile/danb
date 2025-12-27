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
import { getProductSuggestions, addProduct } from '@/lib/actions/products';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';

interface ProductAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ProductAutocomplete({ value, onValueChange }: ProductAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const debouncedInputValue = useDebounce(inputValue, 300);
  const { toast } = useToast();

  React.useEffect(() => {
    if (debouncedInputValue) {
      setIsLoading(true);
      getProductSuggestions(debouncedInputValue)
        .then(setSuggestions)
        .finally(() => setIsLoading(false));
    } else {
      setSuggestions([]);
    }
  }, [debouncedInputValue]);
  
  const handleSelect = async (currentValue: string) => {
    const createNewPrefix = 'Tạo mới "';
    if (currentValue.startsWith(createNewPrefix)) {
      const newProductName = currentValue.substring(createNewPrefix.length, currentValue.length - 1);
      setIsLoading(true);
      try {
        const result = await addProduct({ name: newProductName });
        if (result.success && result.newProduct) {
          onValueChange(result.newProduct.name);
          toast({ title: 'Thành công', description: `Đã tạo sản phẩm mới: ${result.newProduct.name}` });
        }
      } catch (e) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tạo sản phẩm mới.' });
      } finally {
        setIsLoading(false);
      }
    } else {
      onValueChange(currentValue);
    }
    setOpen(false);
    setInputValue('');
  };

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
            {isLoading && (
              <div className="p-2 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!isLoading && !suggestions.length && debouncedInputValue && (
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
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
