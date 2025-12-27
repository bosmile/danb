'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { CalendarIcon, Loader2, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, InvoiceSerializable, InvoiceItem } from '@/types';
import { ProductAutocomplete } from './product-autocomplete';
import { addInvoice, updateInvoice } from '@/lib/actions/invoices';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const invoiceItemSchema = z.object({
    productName: z.string().min(1, { message: 'Tên sản phẩm không được để trống.' }),
    quantity: z.coerce.number().min(0.01, { message: 'Số lượng phải lớn hơn 0.' }),
    price: z.coerce.number().min(1, { message: 'Đơn giá phải lớn hơn 0.' }),
    total: z.coerce.number().min(1, { message: 'Tổng tiền phải lớn hơn 0.' }),
});

const formSchema = z.object({
  category: z.enum(['BIGC', 'SPLZD', 'OTHER'], {
    required_error: 'Vui lòng chọn loại hóa đơn.',
  }),
  date: z.date({ required_error: 'Vui lòng chọn ngày.' }),
  items: z.array(invoiceItemSchema).min(1, { message: 'Hóa đơn phải có ít nhất một sản phẩm.' }),
  grandTotal: z.coerce.number(),
  imageUrl: z.string().optional(),
  imageFile: z.any().optional(),
});

type InvoiceFormData = z.infer<typeof formSchema>;

type InvoiceFormProps = {
  invoiceToEdit?: InvoiceSerializable;
};

export function InvoiceForm({ invoiceToEdit }: InvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: invoiceToEdit
      ? {
          ...invoiceToEdit,
          date: new Date(invoiceToEdit.date),
          items: invoiceToEdit.items.map(item => ({
              ...item,
              quantity: Number(item.quantity),
              price: Number(item.price),
              total: Number(item.total),
          })),
          grandTotal: Number(invoiceToEdit.grandTotal)
        }
      : {
          category: 'BIGC',
          date: new Date(),
          items: [{ productName: '', quantity: 1, price: 0, total: 0 }],
          grandTotal: 0
        },
  });

  const { control, watch, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  useEffect(() => {
    const total = watchedItems.reduce((acc, item) => acc + (item.total || 0), 0);
    if (total !== form.getValues('grandTotal')) {
        setValue('grandTotal', total);
    }
  }, [watchedItems, setValue, form]);

  const updateItemTotal = (index: number) => {
      const item = form.getValues(`items.${index}`);
      if(item && !isNaN(item.quantity) && !isNaN(item.price)) {
          const newTotal = item.quantity * item.price;
          setValue(`items.${index}.total`, newTotal, { shouldValidate: true });
      }
  }

  const onSuccess = () => {
    toast({ title: 'Thành công', description: `Đã ${invoiceToEdit ? 'cập nhật' : 'thêm'} hóa đơn.` });
    router.push('/');
    router.refresh();
  };

  async function onSubmit(values: InvoiceFormData) {
    setLoading(true);
    try {
      const invoiceData = {
          ...values,
          date: values.date,
          imageUrl: values.imageUrl,
          grandTotal: values.items.reduce((sum, item) => sum + item.total, 0),
      };
      
      if (invoiceToEdit) {
        await updateInvoice(invoiceToEdit.id, invoiceData);
      } else {
        await addInvoice(invoiceData as Omit<Invoice, 'id' | 'createdAt'>);
      }
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <FormItem>
                        <FormLabel>Ảnh hóa đơn</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Danh sách sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-start p-3 border rounded-md relative">
                         <div className="col-span-12 sm:col-span-5">
                            <FormField
                                control={control}
                                name={`items.${index}.productName`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Sản phẩm</FormLabel>
                                    <FormControl>
                                        <ProductAutocomplete 
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="col-span-6 sm:col-span-2">
                             <FormField
                                control={control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Số lượng</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="any" {...field} onChange={(e) => {field.onChange(e); updateItemTotal(index)}} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="col-span-6 sm:col-span-2">
                            <FormField
                                control={control}
                                name={`items.${index}.price`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Đơn giá</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={(e) => {field.onChange(e); updateItemTotal(index)}} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="col-span-10 sm:col-span-2">
                            <FormField
                                control={control}
                                name={`items.${index}.total`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Tổng</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} readOnly className="bg-muted" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1 flex items-end justify-end h-full">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={fields.length <= 1}
                                className="mt-auto"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ productName: '', quantity: 1, price: 0, total: 0 })}
                >
                    Thêm sản phẩm
                </Button>
                {form.formState.errors.items && <FormMessage>{form.formState.errors.items.message}</FormMessage>}
            </CardContent>
        </Card>

        <div className="flex justify-between items-center bg-secondary p-4 rounded-lg">
            <span className="text-lg font-bold">TỔNG CỘNG</span>
            <span className="text-lg font-bold">
                 {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(watch('grandTotal') || 0)}
            </span>
        </div>

        <div className="text-right">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {invoiceToEdit ? 'Lưu thay đổi' : 'Thêm hóa đơn'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
