const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function migrate() {
    const dataDir = path.join(process.cwd(), 'data');

    // Helper to map keys to snake_case for DB
    const mapKeys = (item) => {
        const newItem = { ...item };
        if (newItem.createdAt) { newItem.created_at = newItem.createdAt; delete newItem.createdAt; }
        if (newItem.grandTotal) { newItem.grand_total = newItem.grandTotal; delete newItem.grandTotal; }
        if (newItem.imageUrl) { newItem.image_url = newItem.imageUrl; delete newItem.imageUrl; }
        if (newItem.startDate) { newItem.start_date = newItem.startDate; delete newItem.startDate; }
        if (newItem.endDate) { newItem.end_date = newItem.endDate; delete newItem.endDate; }
        if (newItem.totalAmount) { newItem.total_amount = newItem.totalAmount; delete newItem.totalAmount; }
        return newItem;
    };

    // 1. Products
    const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
    await supabase.from('products').upsert(products.map(mapKeys));
    console.log("Products OK");

    // 2. Invoices
    const invoices = JSON.parse(fs.readFileSync(path.join(dataDir, 'invoices.json'), 'utf-8'));
    await supabase.from('invoices').upsert(invoices.map(mapKeys));
    console.log("Invoices OK");

    // 3. Payments
    const payments = JSON.parse(fs.readFileSync(path.join(dataDir, 'payments.json'), 'utf-8'));
    await supabase.from('payments').upsert(payments.map(mapKeys));
    console.log("Payments OK");
}

migrate().then(() => console.log("Done."));
