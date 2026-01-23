'use client';

import { useForm, useFieldArray } from 'react-hook-form';
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
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, InvoiceSerializable } from '@/types';
import { ProductAutocomplete } from './product-autocomplete';
import { addInvoice, updateInvoice } from '@/lib/actions/invoices';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { ManualDateInput } from '../shared/manual-date-input';

const invoiceItemSchema = z.object({
    productName: z.string().min(1, { message: 'Tên sản phẩm không được để trống.' }),
    quantity: z.coerce.number().min(0.01, { message: 'Số lượng phải lớn hơn 0.' }),
    price: z.coerce.number().min(0, { message: 'Đơn giá không được âm.' }),
    total: z.coerce.number().min(0, { message: 'Tổng tiền không được âm.' }),
    receivingPlace: z.enum(['NĐ', 'HN'], {
      required_error: 'Vui lòng chọn nơi nhận.',
    }),
}).refine(data => data.price >= 0, {
    message: "Đơn giá không được âm.",
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
  items: z.array(invoiceItemSchema).min(1, { message: 'Hóa đơn phải có ít nhất một sản phẩm.' }),
  grandTotal: z.coerce.number(),
});

type InvoiceFormData = z.infer<typeof formSchema>;

type InvoiceFormProps = {
  invoiceToEdit?: InvoiceSerializable & { receivingPlace?: 'NĐ' | 'HN' }; // old data might have this
  loading?: boolean;
};

export function InvoiceForm({ invoiceToEdit, loading: formLoading }: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: 'BIGC',
      buyer: 'Hà',
      date: new Date(),
      items: [{ productName: '', quantity: 1, price: 0, total: 0, receivingPlace: 'NĐ' }],
      grandTotal: 0
    },
  });

  useEffect(() => {
    if (invoiceToEdit) {
      form.reset({
        ...invoiceToEdit,
        date: new Date(invoiceToEdit.date),
        items: invoiceToEdit.items.map(item => ({
            ...item,
            quantity: Number(item.quantity),
            price: Number(item.price),
            total: Number(item.total),
            // If item doesn't have receivingPlace (old data), use the one from the invoice
            receivingPlace: item.receivingPlace || invoiceToEdit.receivingPlace || 'NĐ',
        })),
        grandTotal: Number(invoiceToEdit.grandTotal)
      });
    }
  }, [invoiceToEdit, form]);

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
    setIsSubmitting(true);
    try {
      const invoiceData = {
          ...values,
          date: values.date,
          grandTotal: values.items.reduce((sum, item) => sum + item.total, 0),
      };
      
      let result;
      if (invoiceToEdit) {
        result = await updateInvoice(invoiceToEdit.id, invoiceData);
      } else {
        result = await addInvoice(invoiceData as Omit<Invoice, 'id' | 'createdAt'>);
      }

      if (result.success) {
        await onSuccess();
      } else {
        throw new Error(result.error || 'Đã có lỗi xảy ra.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (formLoading) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="sm:col-span-2">
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="sm:col-span-2">
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    );
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                      <FormControl>
                        <ManualDateInput
                          date={field.value}
                          setDate={field.onChange}
                          placeholder="Nhập ngày (ddmmyy)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Danh sách sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="hidden sm:grid grid-cols-12 gap-x-4 gap-y-2 pb-2 border-b font-medium text-sm">
                    <FormLabel className="col-span-4">Sản phẩm</FormLabel>
                    <FormLabel className="col-span-2">Nơi nhận</FormLabel>
                    <FormLabel className="col-span-1">SL</FormLabel>
                    <FormLabel className="col-span-2">Đơn giá</FormLabel>
                    <FormLabel className="col-span-2">Tổng</FormLabel>
                </div>
                 {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-start pt-4 sm:pt-2 border-t sm:border-t-0 sm:border-b pb-4 sm:pb-2">
                        {/* On mobile, use labels for each row */}
                        <div className="col-span-12 sm:col-span-4">
                            <FormLabel className="sm:hidden text-xs font-medium">Sản phẩm</FormLabel>
                            <FormField
                                control={control}
                                name={`items.${index}.productName`}
                                render={({ field }) => (
                                    <FormItem>
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
                            <FormLabel className="sm:hidden text-xs font-medium">Nơi nhận</FormLabel>
                            <FormField
                              control={form.control}
                              name={`items.${index}.receivingPlace`}
                              render={({ field }) => (
                                  <FormItem>
                                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                      <FormControl>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Chọn nơi nhận" />
                                      </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                      <SelectItem value="NĐ">NĐ</SelectItem>
                                      <SelectItem value="HN">HN</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                        </div>

                        <div className="col-span-6 sm:col-span-1">
                             <FormLabel className="sm:hidden text-xs font-medium">Số lượng</FormLabel>
                             <FormField
                                control={control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Input type="number" step="any" placeholder="SL" {...field} onChange={(e) => {field.onChange(e); updateItemFields(index, 'quantity')}} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="col-span-6 sm:col-span-2">
                            <FormLabel className="sm:hidden text-xs font-medium">Đơn giá</FormLabel>
                            <FormField
                                control={control}
                                name={`items.${index}.price`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Input type="number" placeholder="Đơn giá" {...field} onChange={(e) => {field.onChange(e); updateItemFields(index, 'price')}} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="col-span-6 sm:col-span-2">
                            <FormLabel className="sm:hidden text-xs font-medium">Tổng</FormLabel>
                            <FormField
                                control={control}
                                name={`items.${index}.total`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Input type="number" placeholder="Tổng" {...field} onChange={(e) => {field.onChange(e); updateItemFields(index, 'total')}} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="col-span-12 flex justify-end">
                             <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={fields.length <= 1}
                                className="w-8 h-8"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Xóa sản phẩm</span>
                            </Button>
                        </div>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ productName: '', quantity: 1, price: 0, total: 0, receivingPlace: 'NĐ' })}
                >
                    Thêm sản phẩm
                </Button>
                {form.formState.errors.items && <FormMessage>{form.formState.errors.items.message}</FormMessage>}
            </CardContent>
        </Card>

        <div className="flex justify-between items-center bg-secondary p-4 rounded-lg">
            <span className="text-lg font-bold">TỔNG CỘNG</span>
            <span className="text-lg font-bold">
                 {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(watch('grandTotal') || 0)}
            </span>
        </div>

        <div className="text-right">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {invoiceToEdit ? 'Lưu thay đổi' : 'Thêm hóa đơn'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
    