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
import { Textarea } from '../ui/textarea';

const invoiceItemSchema = z.object({
    productName: z.string().min(1, { message: 'Tên sản phẩm không được để trống.' }),
    quantity: z.coerce.number().min(0.01, { message: 'Số lượng phải lớn hơn 0.' }),
    price: z.coerce.number().min(0, { message: 'Đơn giá không được âm.' }),
    total: z.coerce.number().min(0, { message: 'Tổng tiền không được âm.' }),
}).refine(data => data.price > 0 || data.total > 0, {
    message: "Đơn giá hoặc Tổng tiền phải lớn hơn 0",
    path: ["price"],
});


const formSchema = z.object({
  category: z.enum(['BIGC', 'SPLZD', 'OTHER'], {
    required_error: 'Vui lòng chọn loại hóa đơn.',
  }),
  buyer: z.enum(['Hà', 'Hằng'], {
    required_error: 'Vui lòng chọn người mua.',
  }),
  date: z.date({ required_error: 'Vui lòng chọn ngày.' }),
  notes: z.string().optional(),
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
          buyer: 'Hà',
          date: new Date(),
          notes: '',
          items: [{ productName: '', quantity: 1, price: 0, total: 0 }],
          grandTotal: 0
        },
  });

  const { control, watch, setValue, trigger } = form;
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

  const updateItemFields = (index: number, changedField: 'price' | 'total' | 'quantity') => {
      const item = form.getValues(`items.${index}`);
      if (!item || isNaN(item.quantity) || item.quantity <= 0) return;

      if (changedField === 'quantity' || changedField === 'price') {
          const newTotal = item.quantity * item.price;
          setValue(`items.${index}.total`, newTotal, { shouldValidate: true });
      } else if (changedField === 'total') {
          const newPrice = item.total / item.quantity;
          setValue(`items.${index}.price`, newPrice, { shouldValidate: true });
      }
      trigger(`items.${index}`);
  }


  const onSuccess = async () => {
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
      await onSuccess();
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
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                name="buyer"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Người mua</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn người mua" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Hà">Hà</SelectItem>
                        <SelectItem value="Hằng">Hằng</SelectItem>
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
                 <div className="md:col-span-2">
                    <FormItem>
                        <FormLabel>Ảnh hóa đơn</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </div>
                 <div className="md:col-span-2">
                     <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Ghi chú</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Thêm ghi chú cho hóa đơn..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Danh sách sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-x-2 gap-y-2 items-start p-3 border rounded-md relative">
                         <div className="col-span-12">
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
                        <div className="col-span-4">
                             <FormField
                                control={control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Số lượng</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="any" {...field} onChange={(e) => {field.onChange(e); updateItemFields(index, 'quantity')}} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="col-span-8">
                            <FormField
                                control={control}
                                name={`items.${index}.price`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Đơn giá</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={(e) => {field.onChange(e); updateItemFields(index, 'price')}} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="col-span-10">
                            <FormField
                                control={control}
                                name={`items.${index}.total`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Tổng</FormLabel>
                                    <FormControl>
                                         <Input type="number" {...field} onChange={(e) => {field.onChange(e); updateItemFields(index, 'total')}} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="col-span-2 flex items-end justify-end h-full">
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
