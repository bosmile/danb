'use client';

import * as React from 'react';
import { format, parse } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  allowManualInputOnly?: boolean;
}

export function DateRangePicker({ className, date, setDate, allowManualInputOnly = false }: DateRangePickerProps) {
  const [fromValue, setFromValue] = React.useState<string>(date?.from ? format(date.from, 'dd/MM/yyyy') : '');
  const [toValue, setToValue] = React.useState<string>(date?.to ? format(date.to, 'dd/MM/yyyy') : '');

  React.useEffect(() => {
    setFromValue(date?.from ? format(date.from, 'dd/MM/yyyy') : '');
    setToValue(date?.to ? format(date.to, 'dd/MM/yyyy') : '');
  }, [date]);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFromValue(value);
    const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
    if (!isNaN(parsedDate.getTime())) {
      setDate({ from: parsedDate, to: date?.to });
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToValue(value);
    const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
    if (!isNaN(parsedDate.getTime())) {
      setDate({ from: date?.from, to: parsedDate });
    }
  };
  
  if (allowManualInputOnly) {
    return (
        <div className={cn("grid grid-cols-2 gap-2", className)}>
            <Input placeholder="Từ ngày (dd/mm/yyyy)" value={fromValue} onChange={handleFromChange} />
            <Input placeholder="Đến ngày (dd/mm/yyyy)" value={toValue} onChange={handleToChange} />
        </div>
    )
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'dd/MM/yyyy')} -{' '}
                  {format(date.to, 'dd/MM/yyyy')}
                </>
              ) : (
                format(date.from, 'dd/MM/yyyy')
              )
            ) : (
              <span>Chọn khoảng ngày</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
            locale={vi}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
