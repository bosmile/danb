const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL not found in .env.local");
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function setupAndMigrate() {
    console.log("1. Creating tables on Neon...");
    
    await sql.query(`DROP TABLE IF EXISTS products;`);
    await sql.query(`DROP TABLE IF EXISTS invoices;`);
    await sql.query(`DROP TABLE IF EXISTS payments;`);

    await sql.query(`
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await sql.query(`
        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            date TIMESTAMP WITH TIME ZONE NOT NULL,
            grand_total NUMERIC DEFAULT 0,
            image_url TEXT,
            buyer TEXT,
            category TEXT,
            items JSONB,
            notes TEXT,
            is_completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await sql.query(`
        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            start_date TIMESTAMP WITH TIME ZONE NOT NULL,
            end_date TIMESTAMP WITH TIME ZONE NOT NULL,
            total_amount NUMERIC DEFAULT 0,
            report_snapshot TEXT,
            transactions JSONB DEFAULT '[]',
            is_completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log("2. Starting data migration from local JSON files...");
    const dataDir = path.join(process.cwd(), 'data');

    const mapKeys = (item) => {
        const newItem = { ...item };
        if (newItem.hasOwnProperty('createdAt')) { newItem.created_at = newItem.createdAt; delete newItem.createdAt; }
        if (newItem.hasOwnProperty('grandTotal')) { newItem.grand_total = newItem.grandTotal; delete newItem.grandTotal; }
        if (newItem.hasOwnProperty('imageUrl')) { newItem.image_url = newItem.imageUrl; delete newItem.imageUrl; }
        if (newItem.hasOwnProperty('startDate')) { newItem.start_date = newItem.startDate; delete newItem.startDate; }
        if (newItem.hasOwnProperty('endDate')) { newItem.end_date = newItem.endDate; delete newItem.endDate; }
        if (newItem.hasOwnProperty('totalAmount')) { newItem.total_amount = newItem.totalAmount; delete newItem.totalAmount; }
        if (newItem.hasOwnProperty('reportSnapshot')) { newItem.report_snapshot = newItem.reportSnapshot; delete newItem.reportSnapshot; }
        
        // Remove legacy fields
        if (newItem.hasOwnProperty('receivingPlace')) { delete newItem.receivingPlace; }
        if (newItem.hasOwnProperty('paymentStatus')) { delete newItem.paymentStatus; }

        // Convert to proper types for JSONB
        if (newItem.items && typeof newItem.items !== 'string') newItem.items = JSON.stringify(newItem.items);
        if (newItem.transactions && typeof newItem.transactions !== 'string') newItem.transactions = JSON.stringify(newItem.transactions);
        if (newItem.report_snapshot && typeof newItem.report_snapshot !== 'string') newItem.report_snapshot = JSON.stringify(newItem.report_snapshot);
        
        return newItem;
    };

    const pushData = async (table, data) => {
        console.log(`Migrating ${data.length} items to ${table}...`);
        for (const item of data) {
            const dbItem = mapKeys(item);
            const keys = Object.keys(dbItem);
            const values = Object.values(dbItem);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            
            try {
                await sql.query(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${keys.map(k => `${k} = EXCLUDED.${k}`).join(', ')}`, values);
            } catch (err) {
                console.error(`Error migrating item ${item.id} to ${table}:`, err.message);
                console.log("Item keys:", keys);
            }
        }
    };

    // 1. Products
    if (fs.existsSync(path.join(dataDir, 'products.json'))) {
        const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
        await pushData('products', products);
        console.log("Products finished.");
    }

    // 2. Invoices
    if (fs.existsSync(path.join(dataDir, 'invoices.json'))) {
        const invoices = JSON.parse(fs.readFileSync(path.join(dataDir, 'invoices.json'), 'utf-8'));
        await pushData('invoices', invoices);
        console.log("Invoices finished.");
    }

    // 3. Payments
    if (fs.existsSync(path.join(dataDir, 'payments.json'))) {
        const payments = JSON.parse(fs.readFileSync(path.join(dataDir, 'payments.json'), 'utf-8'));
        await pushData('payments', payments);
        console.log("Payments finished.");
    }
}

setupAndMigrate().then(() => {
    console.log("\nSetup and Migration finished successfully!");
    process.exit(0);
}).catch(err => {
    console.error("\nSetup failed:", err);
    process.exit(1);
});
