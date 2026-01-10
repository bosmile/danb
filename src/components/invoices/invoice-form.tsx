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
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, InvoiceSerializable } from '@/types';
import { ProductAutocomplete } from './product-autocomplete';
import { addInvoice, updateInvoice } from '@/lib/actions/invoices';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
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
  invoiceToEdit?: InvoiceSerializable & { receivingPlace?: 'NĐ' | 'HN' }; // old data might have this
  loading?: boolean;
};

export function InvoiceForm({ invoiceToEdit, loading: formLoading }: InvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: 'BIGC',
      buyer: 'Hà',
      date: new Date(),
      notes: '',
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
                 <div className="grid grid-cols-12 gap-x-4 gap-y-2 pb-2 border-b">
                    <FormLabel className="col-span-12 sm:col-span-5">Sản phẩm</FormLabel>
                    <FormLabel className="col-span-6 sm:col-span-2">Số lượng</FormLabel>
                    <FormLabel className="col-span-6 sm:col-span-2">Đơn giá</FormLabel>
                    <FormLabel className="col-span-12 sm:col-span-3">Tổng</FormLabel>
                </div>
                 {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-start pt-2">
                        {/* Row 1: Product Name & Receiving Place */}
                        <div className="col-span-12 md:col-span-5">
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

                         <div className="col-span-12 md:col-span-7 grid grid-cols-10 gap-x-4">
                            <div className="col-span-10 sm:col-span-3">
                                <FormField
                                    control={control}
                                    name={`items.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormControl>
                                            <Input type="number" step="any" placeholder="Số lượng" {...field} onChange={(e) => {field.onChange(e); updateItemFields(index, 'quantity')}} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="col-span-10 sm:col-span-3">
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
                            <div className="col-span-10 sm:col-span-4">
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
                         </div>

                        {/* Row 2: Receiving Place & Delete Button */}
                        <div className="col-span-8 md:col-span-5">
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
                        <div className="col-span-4 md:col-span-7 flex justify-end">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={fields.length <= 1}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                         {index < fields.length -1 && <div className="col-span-12 border-b pt-4"></div>}
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
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {invoiceToEdit ? 'Lưu thay đổi' : 'Thêm hóa đơn'}
            </Button>
        </div>
      </form>
    </Form>
  );
}

    
