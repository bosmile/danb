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
import { useIsMobile } from '@/hooks/use-mobile';

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  allowManualInput?: boolean;
}

export function DateRangePicker({ className, date, setDate, allowManualInput = false }: DateRangePickerProps) {
  const isMobile = useIsMobile();
  const [fromValue, setFromValue] = React.useState<string>(date?.from ? format(date.from, 'dd/MM/yyyy') : '');
  const [toValue, setToValue] = React.useState<string>(date?.to ? format(date.to, 'dd/MM/yyyy') : '');

  React.useEffect(() => {
    setFromValue(date?.from ? format(date.from, 'dd/MM/yyyy') : '');
    setToValue(date?.to ? format(date.to, 'dd/MM/yyyy') : '');
  }, [date]);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromValue(e.target.value);
    const parsedDate = parse(e.target.value, 'dd/MM/yyyy', new Date());
    if (!isNaN(parsedDate.getTime())) {
      setDate({ from: parsedDate, to: date?.to });
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToValue(e.target.value);
    const parsedDate = parse(e.target.value, 'dd/MM/yyyy', new Date());
    if (!isNaN(parsedDate.getTime())) {
      setDate({ from: date?.from, to: parsedDate });
    }
  };

  const numberOfMonths = isMobile || allowManualInput ? 1 : 2;

  if (allowManualInput) {
    return (
      <div className={cn('grid gap-2', className)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-full md:w-[300px] justify-start text-left font-normal',
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
              numberOfMonths={numberOfMonths}
              locale={vi}
            />
             <div className="p-2 grid grid-cols-2 gap-2">
                <Input placeholder="Từ ngày (dd/mm/yyyy)" value={fromValue} onChange={handleFromChange} />
                <Input placeholder="Đến ngày (dd/mm/yyyy)" value={toValue} onChange={handleToChange} />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full md:w-[300px] justify-start text-left font-normal',
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
            numberOfMonths={numberOfMonths}
            locale={vi}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
