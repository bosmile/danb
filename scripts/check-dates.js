const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function checkData() {
    const sql = neon(process.env.DATABASE_URL);
    try {
        const payments = await sql`SELECT id, start_date, end_date FROM payments`;
        console.log("Payments found:", payments.length);
        payments.forEach(p => {
            console.log(`ID: ${p.id}`);
            console.log(`  start_date: ${p.start_date} (type: ${typeof p.start_date})`);
            console.log(`  end_date: ${p.end_date} (type: ${typeof p.end_date})`);
        });
    } catch (err) {
        console.error("Failed:", err.message);
    }
}

checkData();
