import fs from 'fs/promises';
import path from 'path';
import { crypto } from 'next/dist/compiled/@edge-runtime/primitives'; // For Edge/Node compatibility

const STORAGE_DIR = path.join(process.cwd(), 'public', 'data', 'images');

export async function ensureStorageDir() {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
}

export async function saveImage(file: File | string): Promise<string> {
  await ensureStorageDir();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.png`;
  const filePath = path.join(STORAGE_DIR, fileName);

  if (typeof file === 'string' && file.startsWith('data:image')) {
    // Base64 handling
    const base64Data = file.split(',')[1];
    await fs.writeFile(filePath, base64Data, 'base64');
  } else if (file instanceof File) {
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);
  } else {
    throw new Error('Invalid image format');
  }

  return `/data/images/${fileName}`;
}

export async function deleteImage(imageUrl: string) {
  if (!imageUrl.startsWith('/data/images/')) return;
  const fileName = path.basename(imageUrl);
  const filePath = path.join(STORAGE_DIR, fileName);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.warn(`Failed to delete image: ${filePath}`, error);
  }
}
