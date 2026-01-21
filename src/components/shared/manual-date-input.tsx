'use client';

import * as React from 'react';
import { format, parse } from 'date-fns';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

interface ManualDateInputProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function ManualDateInput({ date, setDate, placeholder, className }: ManualDateInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // When the date prop changes from outside, update the input
  // BUT, do not update if the input is currently focused. This prevents overwriting user input.
  React.useEffect(() => {
    if (document.activeElement !== inputRef.current) {
        if (date) {
            setInputValue(format(date, 'dd/MM/yyyy'));
        } else {
            setInputValue('');
        }
    }
  }, [date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(value);

    // If 6 digits are entered, parse it
    if (value.length === 6) {
      const parsedDate = parse(value, 'ddMMyy', new Date());
      // Check if the parsed date is valid
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate);
        // Do NOT reformat here. Let the user continue typing if they want.
        // Let onBlur handle the final formatting.
      } else {
        // If the 6-digit string is not a valid date, unset the date in parent
        setDate(undefined);
      }
    } else if (value === '') {
      setDate(undefined);
    } else {
      // If the input is incomplete, the date is not yet valid
      setDate(undefined);
    }
  };

  const handleBlur = () => {
    // When the user leaves the input, format it nicely based on the current valid 'date' state.
    // If the input was invalid, it will revert to the last valid date or become empty.
    if (date) {
      setInputValue(format(date, 'dd/MM/yyyy'));
    } else {
      setInputValue('');
    }
  };
  
  const handleFocus = () => {
    // When focusing, if there's a valid date, show the ddmmyy format for editing
     if (date) {
        setInputValue(format(date, 'ddMMyy'));
     }
  }

  return (
    <div className={cn('relative w-full', className)}>
      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        maxLength={10} // dd/MM/yyyy is 10 chars
        className="pl-9"
      />
    </div>
  );
}
