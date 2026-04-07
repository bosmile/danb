import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Data loading will fail until configured.');
}

// Export the client for more advanced queries. 
// Note: createClient will throw if url is empty. 
// Using a placeholder if missing to avoid crashing on import, though queries will still fail.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseAnonKey || 'placeholder'
);

// Helper to convert snake_case DB object to camelCase App object
export function fromDB(item: any) {
  if (!item) return item;
  const newItem = { ...item };
  if ('created_at' in newItem) { newItem.createdAt = newItem.created_at; delete newItem.created_at; }
  if ('grand_total' in newItem) { newItem.grandTotal = newItem.grand_total; delete newItem.grand_total; }
  if ('image_url' in newItem) { newItem.imageUrl = newItem.image_url; delete newItem.image_url; }
  if ('start_date' in newItem) { newItem.startDate = newItem.start_date; delete newItem.start_date; }
  if ('end_date' in newItem) { newItem.endDate = newItem.end_date; delete newItem.end_date; }
  if ('total_amount' in newItem) { newItem.totalAmount = newItem.total_amount; delete newItem.total_amount; }
  if ('report_snapshot' in newItem) { newItem.reportSnapshot = newItem.report_snapshot; delete newItem.report_snapshot; }
  if ('is_completed' in newItem) { newItem.isCompleted = newItem.is_completed; delete newItem.is_completed; }
  return newItem;
}

// Helper to convert camelCase App object to snake_case DB object
export function toDB(item: any) {
  if (!item) return item;
  const newItem = { ...item };
  if ('createdAt' in newItem) { newItem.created_at = newItem.createdAt; delete newItem.createdAt; }
  if ('grandTotal' in newItem) { newItem.grand_total = newItem.grandTotal; delete newItem.grandTotal; }
  if ('imageUrl' in newItem) { newItem.image_url = newItem.imageUrl; delete newItem.imageUrl; }
  if ('startDate' in newItem) { newItem.start_date = newItem.startDate; delete newItem.startDate; }
  if ('endDate' in newItem) { newItem.end_date = newItem.endDate; delete newItem.endDate; }
  if ('totalAmount' in newItem) { newItem.total_amount = newItem.totalAmount; delete newItem.totalAmount; }
  if ('reportSnapshot' in newItem) { newItem.report_snapshot = newItem.reportSnapshot; delete newItem.reportSnapshot; }
  if ('isCompleted' in newItem) { newItem.is_completed = newItem.isCompleted; delete newItem.isCompleted; }
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
