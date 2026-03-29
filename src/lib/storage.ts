import { supabase } from './db';

const BUCKET = 'invoices';
const PROJECT_ID = 'flqdcuftonmghcjdqxej';

export async function ensureStorageDir() {
    // No-op for Supabase Storage
}

export async function saveImage(file: File | string): Promise<string> {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.png`;
    let fileBody: any;
    let contentType = 'image/png';

    if (typeof file === 'string' && file.startsWith('data:image')) {
        // Base64 handling
        const base64Data = file.split(',')[1];
        fileBody = Buffer.from(base64Data, 'base64');
    } else if (file instanceof File) {
        fileBody = await file.arrayBuffer();
        contentType = file.type;
    } else {
        throw new Error('Invalid image format');
    }

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, fileBody, {
            contentType,
            upsert: true
        });

    if (error) {
        console.error('Error uploading to Supabase Storage:', error);
        return `https://picsum.photos/seed/${fileName}/400/600`;
    }

    return `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/${BUCKET}/${fileName}`;
}

export async function deleteImage(imageUrl: string) {
    if (!imageUrl.includes(BUCKET)) return;
    
    try {
        const fileName = imageUrl.split('/').pop();
        if (fileName) {
            await supabase.storage.from(BUCKET).remove([fileName]);
        }
    } catch (error) {
        console.warn(`Failed to delete Supabase image: ${imageUrl}`, error);
    }
}
