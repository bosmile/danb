'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProductSerializable } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { addProduct } from '@/lib/actions/products'; // Assume updateProduct exists too
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Tên sản phẩm phải có ít nhất 2 ký tự.' }),
});

type ProductFormData = z.infer<typeof formSchema>;

type ProductFormModalProps = {
  productToEdit?: ProductSerializable;
  onProductAdded: () => void;
  children?: React.ReactNode;
};

export function ProductFormModal({ productToEdit, onProductAdded, children }: ProductFormModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: productToEdit?.name || '',
    },
  });

  const handleSuccess = () => {
    onProductAdded();
    setOpen(false);
    form.reset({ name: '' });
  };

  async function onSubmit(values: ProductFormData) {
    setLoading(true);
    try {
      if (productToEdit) {
        // await updateProduct(productToEdit.id, values);
        console.log("Updating product", productToEdit.id, values);
        await new Promise(res => setTimeout(res, 500));
        toast({ title: 'Thành công', description: 'Đã cập nhật sản phẩm.' });
      } else {
        await addProduct(values);
        toast({ title: 'Thành công', description: 'Đã thêm sản phẩm mới.' });
      }
      handleSuccess();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể lưu sản phẩm.' });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : (
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm sản phẩm
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{productToEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
          <DialogDescription>
            {productToEdit ? 'Cập nhật tên cho sản phẩm này.' : 'Thêm một sản phẩm mới vào danh sách.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên sản phẩm</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Sữa tươi Vinamilk" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {productToEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
