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
import { Loader2, Trash2, PlusCircle, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { InvoiceSerializable } from '@/types';
import { ProductAutocomplete } from './product-autocomplete';
import { addInvoice, updateInvoice } from '@/lib/actions/invoices';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { ManualDateInput } from '../shared/manual-date-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const invoiceItemSchema = z.object({
    productName: z.string().min(1, { message: 'Tên sản phẩm không được để trống.' }),
    quantity: z.coerce.number().min(0.01, { message: 'Số lượng phải lớn hơn 0.' }),
    price: z.coerce.number().min(0, { message: 'Đơn giá không được âm.' }),
    total: z.coerce.number().min(0, { message: 'Tổng tiền không được âm.' }),
    receivingPlace: z.enum(['NĐ', 'HN'], {
      required_error: 'Vui lòng chọn nơi nhận.',
    }),
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
  invoiceToEdit?: InvoiceSerializable & { receivingPlace?: 'NĐ' | 'HN' };
  loading?: boolean;
};

// Shopee Parser
function parseShopeeOrder(text: string) {
    const items: any[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match price like ₫45.000 x 2 or 123.000đ x 1
        const priceMatch = line.match(/(?:₫|đ)?([\d.]+)(?:₫|đ)?\s*x\s*(\d+)/i);
        if (priceMatch && i > 0) {
            const productName = lines[i-1];
            const price = parseInt(priceMatch[1].replace(/\./g, ''));
            const quantity = parseInt(priceMatch[2]);
            items.push({
                productName,
                price: price,
                quantity: quantity,
                total: price * quantity,
                receivingPlace: 'NĐ'
            });
        }
    }
    return items;
}

export function InvoiceForm({ invoiceToEdit, loading: formLoading }: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shopeeText, setShopeeText] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
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

  const { control, watch, setValue, trigger, reset, getValues } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    if (invoiceToEdit) {
      reset({
        ...invoiceToEdit,
        date: new Date(invoiceToEdit.date),
        items: invoiceToEdit.items.map(item => ({
            ...item,
            quantity: Number(item.quantity),
            price: Number(item.price),
            total: Number(item.total),
            receivingPlace: item.receivingPlace || invoiceToEdit.receivingPlace || 'NĐ',
        })),
        grandTotal: Number(invoiceToEdit.grandTotal)
      });
    }
  }, [invoiceToEdit, reset]);

  const watchedItems = watch('items');

  useEffect(() => {
    const total = watchedItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
    if (total !== Number(getValues('grandTotal'))) {
        setValue('grandTotal', total);
    }
  }, [watchedItems, setValue, getValues]);

  const updateItemFields = (index: number, changedField: 'price' | 'total' | 'quantity') => {
      const item = getValues(`items.${index}`);
      if (!item) return;
      
      const quantity = Number(item.quantity);
      const price = Number(item.price);
      const total = Number(item.total);

      if (isNaN(quantity) || quantity <= 0) return;

      if (changedField === 'quantity' || changedField === 'price') {
          const newTotal = quantity * price;
          setValue(`items.${index}.total`, newTotal, { shouldValidate: true });
      } else if (changedField === 'total') {
          const newPrice = total / quantity;
          setValue(`items.${index}.price`, newPrice, { shouldValidate: true });
      }
      trigger(`items.${index}`);
  }

  const handleShopeeImport = () => {
      const items = parseShopeeOrder(shopeeText);
      if (items.length > 0) {
          setValue('items', items);
          setValue('category', 'SPLZD');
          setIsImportDialogOpen(false);
          setShopeeText('');
          toast({ title: 'Thành công', description: `Đã nhập ${items.length} sản phẩm từ Shopee.` });
      } else {
          toast({ variant: 'destructive', title: 'Lỗi', description: 'Không tìm thấy dữ liệu sản phẩm hợp lệ. Vui lòng kiểm tra lại nội dung dán.' });
      }
  };

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
        result = await addInvoice(invoiceData);
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
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-end pt-2">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto bg-orange-50 text-orange-600 border-orange-200 h-12 sm:h-10 hover:bg-orange-100 hover:text-orange-700 font-bold shadow-sm">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Nhập từ Shopee
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Nhập dữ liệu từ Shopee</DialogTitle>
                        <DialogDescription>
                            Mở trang chi tiết đơn hàng Shopee trên máy tính, bôi đen toàn bộ nội dung (Ctrl+A) và dán vào đây.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="Ví dụ:
Dầu ăn Neptune 1L
₫45.000 x 2
..." 
                            className="min-h-[300px]"
                            value={shopeeText}
                            onChange={(e) => setShopeeText(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsImportDialogOpen(false)}>Hủy</Button>
                        <Button type="button" onClick={handleShopeeImport} disabled={!shopeeText.trim()} className="bg-orange-600 hover:bg-orange-700">Nhập dữ liệu</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                control={control}
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
                control={control}
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
                control={control}
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
                    <div key={field.id} className="grid grid-cols-12 gap-x-4 gap-y-3 items-start p-4 sm:p-0 border rounded-2xl sm:border-0 sm:border-b sm:rounded-none bg-slate-50/30 sm:bg-transparent">
                        <div className="col-span-12 sm:col-span-4">
                            <FormLabel className="sm:hidden text-xs font-bold text-slate-500 mb-1 block">Sản phẩm #{index + 1}</FormLabel>
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

                         <div className="col-span-12 sm:col-span-2">
                            <FormLabel className="sm:hidden text-xs font-bold text-slate-500 mb-1 block">Nơi nhận</FormLabel>
                            <FormField
                              control={control}
                              name={`items.${index}.receivingPlace`}
                              render={({ field }) => (
                                  <FormItem>
                                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                      <FormControl>
                                      <SelectTrigger className="h-11 sm:h-10">
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

                        <div className="col-span-4 sm:col-span-1">
                             <FormLabel className="sm:hidden text-xs font-bold text-slate-500 mb-1 block">SL</FormLabel>
                             <FormField
                                control={control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Input type="number" step="any" className="h-11 sm:h-10" placeholder="SL" {...field} onChange={(e) => {field.onChange(e); updateItemFields(index, 'quantity')}} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="col-span-8 sm:col-span-2">
                            <FormLabel className="sm:hidden text-xs font-bold text-slate-500 mb-1 block">Đơn giá</FormLabel>
                            <FormField
                                control={control}
                                name={`items.${index}.price`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Input type="number" className="h-11 sm:h-10" placeholder="Đơn giá" {...field} onChange={(e) => {field.onChange(e); updateItemFields(index, 'price')}} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="col-span-10 sm:col-span-2">
                            <FormLabel className="sm:hidden text-xs font-bold text-slate-500 mb-1 block">Tổng tiền</FormLabel>
                            <FormField
                                control={control}
                                name={`items.${index}.total`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Input type="number" className="h-11 sm:h-10 font-bold text-primary" placeholder="Tổng" {...field} onChange={(e) => {field.onChange(e); updateItemFields(index, 'total')}} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1 flex items-end justify-end h-full sm:pb-2">
                             <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={fields.length <= 1}
                                className="w-10 h-10 sm:w-8 sm:h-8"
                            >
                                <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                                <span className="sr-only">Xóa</span>
                            </Button>
                        </div>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ productName: '', quantity: 1, price: 0, total: 0, receivingPlace: 'NĐ' })}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Thêm sản phẩm
                </Button>
                {form.formState.errors.items && <FormMessage>{form.formState.errors.items.message}</FormMessage>}
            </CardContent>
        </Card>

        <div className="flex justify-between items-center bg-secondary p-4 rounded-lg">
            <span className="text-lg font-bold">TỔNG CỘNG</span>
            <span className="text-lg font-bold text-primary">
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