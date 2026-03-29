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
        
        // General conversions
        if (newItem.hasOwnProperty('createdAt')) { newItem.created_at = newItem.createdAt; delete newItem.createdAt; }
        if (newItem.hasOwnProperty('grandTotal')) { newItem.grand_total = newItem.grandTotal; delete newItem.grandTotal; }
        if (newItem.hasOwnProperty('imageUrl')) { newItem.image_url = newItem.imageUrl; delete newItem.imageUrl; }
        if (newItem.hasOwnProperty('startDate')) { newItem.start_date = newItem.startDate; delete newItem.startDate; }
        if (newItem.hasOwnProperty('endDate')) { newItem.end_date = newItem.endDate; delete newItem.endDate; }
        if (newItem.hasOwnProperty('totalAmount')) { newItem.total_amount = newItem.totalAmount; delete newItem.totalAmount; }
        if (newItem.hasOwnProperty('reportSnapshot')) { newItem.report_snapshot = newItem.reportSnapshot; delete newItem.reportSnapshot; }
        
        // Legacy fields from JSON to remove before saving to DB
        if (newItem.hasOwnProperty('receivingPlace')) { delete newItem.receivingPlace; }
        
        return newItem;
    };

    // 1. Products
    const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
    const { error: err1 } = await supabase.from('products').upsert(products.map(mapKeys));
    if (err1) console.error("Error migrating products:", err1);
    else console.log("Products OK");
  
    // 2. Invoices
    const invoices = JSON.parse(fs.readFileSync(path.join(dataDir, 'invoices.json'), 'utf-8'));
    const { error: err2 } = await supabase.from('invoices').upsert(invoices.map(mapKeys));
    if (err2) console.error("Error migrating invoices:", err2);
    else console.log("Invoices OK");
  
    // 3. Payments
    const payments = JSON.parse(fs.readFileSync(path.join(dataDir, 'payments.json'), 'utf-8'));
    const { error: err3 } = await supabase.from('payments').upsert(payments.map(mapKeys));
    if (err3) console.error("Error migrating payments:", err3);
    else console.log("Payments OK");
}

migrate().then(() => console.log("Done."));
