'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, InvoiceSerializable, InvoiceCategory } from '@/types';
import { ProductAutocomplete } from './product-autocomplete';
import { addInvoice, updateInvoice } from '@/lib/actions/invoices';

const formSchema = z.object({
  category: z.enum(['BIGC', 'SPLZD', 'OTHER'], {
    required_error: 'Vui lòng chọn loại hóa đơn.',
  }),
  productName: z.string().min(1, { message: 'Tên sản phẩm không được để trống.' }),
  quantity: z.coerce.number().min(0.01, { message: 'Số lượng phải lớn hơn 0.' }),
  price: z.coerce.number().min(1, { message: 'Đơn giá phải lớn hơn 0.' }),
  date: z.date({ required_error: 'Vui lòng chọn ngày.' }),
  imageUrl: z.string().optional(),
  // For file upload, we handle it separately
  imageFile: z.any().optional(),
});

type InvoiceFormData = z.infer<typeof formSchema>;

type InvoiceFormProps = {
  invoiceToEdit?: InvoiceSerializable;
  onSuccess: () => void;
};

export function InvoiceForm({ invoiceToEdit, onSuccess }: InvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: invoiceToEdit
      ? {
          ...invoiceToEdit,
          date: new Date(invoiceToEdit.date),
          quantity: Number(invoiceToEdit.quantity),
          price: Number(invoiceToEdit.price),
        }
      : {
          category: 'BIGC',
          productName: '',
          quantity: 1,
          price: 0,
          date: new Date(),
        },
  });

  const { watch, setValue } = form;
  const quantity = watch('quantity');
  const price = watch('price');
  const total = isNaN(quantity) || isNaN(price) ? 0 : quantity * price;

  async function onSubmit(values: InvoiceFormData) {
    setLoading(true);
    try {
      // In a real app, handle file upload to Firebase Storage here
      // and get the imageUrl.
      // For now, we'll just use a placeholder if no image exists.
      
      const invoiceData = {
          ...values,
          date: values.date,
          // If editing and no new file, keep old URL.
          imageUrl: values.imageUrl,
      };
      
      if (invoiceToEdit) {
        await updateInvoice(invoiceToEdit.id, invoiceData);
        toast({ title: 'Thành công', description: 'Đã cập nhật hóa đơn.' });
      } else {
        await addInvoice(invoiceData as Omit<Invoice, 'id' | 'total' | 'createdAt'>);
        toast({ title: 'Thành công', description: 'Đã thêm hóa đơn mới.' });
      }
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loại</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại hóa đơn" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BIGC">BIGC</SelectItem>
                  <SelectItem value="SPLZD">SPLZD</SelectItem>
                  <SelectItem value="OTHER">Khác</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Ngày</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: vi })
                      ) : (
                        <span>Chọn ngày</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    initialFocus
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên sản phẩm</FormLabel>
                  <FormControl>
                    <ProductAutocomplete />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số lượng</FormLabel>
              <FormControl>
                <Input type="number" step="any" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Đơn giá</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="sm:col-span-2">
            <FormLabel>Tổng cộng</FormLabel>
            <Input
              readOnly
              value={new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(total)}
              className="mt-2 font-bold text-lg h-11 bg-muted"
            />
        </div>
        <div className="sm:col-span-2">
            <FormItem>
                <FormLabel>Ảnh hóa đơn</FormLabel>
                <FormControl>
                    <Input type="file" accept="image/*" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </div>

        <div className="sm:col-span-2 text-right">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {invoiceToEdit ? 'Lưu thay đổi' : 'Thêm hóa đơn'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
