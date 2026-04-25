import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  console.warn('Neon DATABASE_URL missing. Data loading will fail until configured.');
}

// Neon client
export const sql = neon(databaseUrl);

// Helper to convert snake_case DB object to camelCase App object
export function fromDB(item: any) {
  if (!item) return item;
  const newItem = { ...item };
  
  const toISO = (val: any) => {
    if (!val) return val;
    if (val instanceof Date) return val.toISOString();
    return val;
  };

  if ('created_at' in newItem) { newItem.createdAt = toISO(newItem.created_at); delete newItem.created_at; }
  if ('date' in newItem) { newItem.date = toISO(newItem.date); }
  if ('start_date' in newItem) { newItem.startDate = toISO(newItem.start_date); delete newItem.start_date; }
  if ('end_date' in newItem) { newItem.endDate = toISO(newItem.end_date); delete newItem.end_date; }
  
  if ('grand_total' in newItem) { newItem.grandTotal = Number(newItem.grand_total); delete newItem.grand_total; }
  if ('image_url' in newItem) { newItem.imageUrl = newItem.image_url; delete newItem.image_url; }
  if ('total_amount' in newItem) { newItem.totalAmount = Number(newItem.total_amount); delete newItem.total_amount; }
  if ('report_snapshot' in newItem) { newItem.reportSnapshot = newItem.report_snapshot; delete newItem.report_snapshot; }
  
  newItem.isCompleted = !!newItem.is_completed;
  delete newItem.is_completed;

  // Special handling for items which might contain strings from JSONB
  if (newItem.items && Array.isArray(newItem.items)) {
    newItem.items = newItem.items.map((it: any) => ({
      ...it,
      quantity: Number(it.quantity || 0),
      price: Number(it.price || 0),
      total: Number(it.total || 0)
    }));
  }

  // Handle transactions in payments
  if (newItem.transactions && Array.isArray(newItem.transactions)) {
    newItem.transactions = newItem.transactions.map((t: any) => ({
      ...t,
      date: toISO(t.date),
      amount: Number(t.amount || 0)
    }));
  }
  
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

  // Stringify JSON fields for Postgres
  const jsonFields = ['items', 'report_snapshot', 'transactions'];
  for (const field of jsonFields) {
    if (field in newItem && newItem[field] !== null && typeof newItem[field] === 'object') {
      newItem[field] = JSON.stringify(newItem[field]);
    }
  }

  return newItem;
}

export async function readCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const data = await sql.query(`SELECT * FROM ${collectionName}`);
    return (data || []).map(fromDB) as T[];
  } catch (error) {
    console.error(`Error reading ${collectionName}:`, error);
    return [];
  }
}

export async function getItemById<T extends { id: string }>(collectionName: string, id: string): Promise<T | null> {
  try {
    const data = await sql.query(`SELECT * FROM ${collectionName} WHERE id = $1`, [id]);
    if (!data || data.length === 0) return null;
    return fromDB(data[0]) as T;
  } catch (error) {
    console.error(`Error getting item ${id} from ${collectionName}:`, error);
    return null;
  }
}

export async function addItem<T extends { id: string }>(collectionName: string, item: T): Promise<void> {
  const dbItem = toDB(item);
  const keys = Object.keys(dbItem);
  const values = Object.values(dbItem);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  
  try {
    await sql.query(
      `INSERT INTO ${collectionName} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
  } catch (error) {
    console.error(`Error adding to ${collectionName}:`, error);
    throw error;
  }
}

export async function updateItem<T extends { id: string }>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
  const dbData = toDB(data);
  const keys = Object.keys(dbData);
  const values = Object.values(dbData);
  
  if (keys.length === 0) return;
  
  const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
  
  try {
    await sql.query(
      `UPDATE ${collectionName} SET ${setClause} WHERE id = $1`,
      [id, ...values]
    );
  } catch (error) {
    console.error(`Error updating ${id} in ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteItem(collectionName: string, id: string): Promise<void> {
  try {
    await sql.query(`DELETE FROM ${collectionName} WHERE id = $1`, [id]);
  } catch (error) {
    console.error(`Error deleting ${id} from ${collectionName}:`, error);
    throw error;
  }
}


