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

  // When the date prop changes from outside, update the input
  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, 'dd/MM/yyyy'));
    } else {
      setInputValue('');
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
        setInputValue(format(parsedDate, 'dd/MM/yyyy'));
      }
    }
  };

  const handleBlur = () => {
    // On blur, if the input is not a valid formatted date, reset to the last valid date or empty
    if (date) {
      const formatted = format(date, 'dd/MM/yyyy');
      if (inputValue !== formatted) {
          // Check if it's a 6 digit entry that hasn't been parsed yet
          if(inputValue.length === 6) {
             const parsedDate = parse(inputValue, 'ddMMyy', new Date());
             if (!isNaN(parsedDate.getTime())) {
                setDate(parsedDate);
                setInputValue(format(parsedDate, 'dd/MM/yyyy'));
             } else {
                setInputValue(formatted);
             }
          } else {
            setInputValue(formatted);
          }
      }
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
