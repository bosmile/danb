import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Data loading will fail until configured.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to convert snake_case DB object to camelCase App object
function fromDB(item: any) {
  if (!item) return item;
  const newItem = { ...item };
  if (newItem.hasOwnProperty('created_at')) { newItem.createdAt = newItem.created_at; delete newItem.created_at; }
  if (newItem.hasOwnProperty('grand_total')) { newItem.grandTotal = newItem.grand_total; delete newItem.grand_total; }
  if (newItem.hasOwnProperty('image_url')) { newItem.imageUrl = newItem.image_url; delete newItem.image_url; }
  if (newItem.hasOwnProperty('start_date')) { newItem.startDate = newItem.start_date; delete newItem.start_date; }
  if (newItem.hasOwnProperty('end_date')) { newItem.endDate = newItem.end_date; delete newItem.endDate; }
  if (newItem.hasOwnProperty('total_amount')) { newItem.totalAmount = newItem.total_amount; delete newItem.total_amount; }
  return newItem;
}

// Helper to convert camelCase App object to snake_case DB object
function toDB(item: any) {
  if (!item) return item;
  const newItem = { ...item };
  if (newItem.hasOwnProperty('createdAt')) { newItem.created_at = newItem.createdAt; delete newItem.createdAt; }
  if (newItem.hasOwnProperty('grandTotal')) { newItem.grand_total = newItem.grandTotal; delete newItem.grandTotal; }
  if (newItem.hasOwnProperty('imageUrl')) { newItem.image_url = newItem.imageUrl; delete newItem.imageUrl; }
  if (newItem.hasOwnProperty('startDate')) { newItem.start_date = newItem.startDate; delete newItem.startDate; }
  if (newItem.hasOwnProperty('endDate')) { newItem.end_date = newItem.endDate; delete newItem.endDate; }
  if (newItem.hasOwnProperty('totalAmount')) { newItem.total_amount = newItem.totalAmount; delete newItem.totalAmount; }
  return newItem;
}

export async function readCollection<T>(collectionName: string): Promise<T[]> {
  const { data, error } = await supabase
    .from(collectionName)
    .select('*');
    
  if (error) {
    console.error(`Error reading ${collectionName}:`, error);
    return [];
  }
  return (data || []).map(fromDB) as T[];
}

export async function getItemById<T extends { id: string }>(collectionName: string, id: string): Promise<T | null> {
  const { data, error } = await supabase
    .from(collectionName)
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    if (error.code !== 'PGRST116') {
        console.error(`Error getting item ${id} from ${collectionName}:`, error);
    }
    return null;
  }
  return fromDB(data) as T;
}

export async function addItem<T extends { id: string }>(collectionName: string, item: T): Promise<void> {
  const { error } = await supabase
    .from(collectionName)
    .insert(toDB(item));
    
  if (error) {
    console.error(`Error adding to ${collectionName}:`, error);
    throw error;
  }
}

export async function updateItem<T extends { id: string }>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
  const { error } = await supabase
    .from(collectionName)
    .update(toDB(data))
    .eq('id', id);
    
  if (error) {
    console.error(`Error updating ${id} in ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteItem(collectionName: string, id: string): Promise<void> {
  const { error } = await supabase
    .from(collectionName)
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error(`Error deleting ${id} from ${collectionName}:`, error);
    throw error;
  }
}
