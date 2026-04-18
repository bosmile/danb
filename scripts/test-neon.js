const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
    console.log("Testing connection with URL:", process.env.DATABASE_URL?.substring(0, 30) + "...");
    const sql = neon(process.env.DATABASE_URL);
    try {
        const resultTemplate = await sql`SELECT NOW()`;
        console.log("Template result (row 0):", resultTemplate[0]);

        const resultQuery = await sql.query("SELECT NOW()");
        console.log("Query result is array?", Array.isArray(resultQuery));
        console.log("Query result [0]:", resultQuery[0]);
    } catch (err) {
        console.error("Connection failed:", err.message);
    }
}

testConnection();
