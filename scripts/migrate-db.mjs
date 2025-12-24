import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local file
const envLocalPath = resolve(__dirname, '../.env.local');
const envPath = resolve(__dirname, '../.env');

let DATABASE_URL;

try {
    const envLocalContent = readFileSync(envLocalPath, 'utf-8');
    const match = envLocalContent.match(/DATABASE_URL=(.+)/);
    if (match) {
        DATABASE_URL = match[1].trim().replace(/^["']|["']$/g, '');
    }
} catch (e) {
    console.log('.env.local not found, trying .env');
}

if (!DATABASE_URL) {
    try {
        const envContent = readFileSync(envPath, 'utf-8');
        const match = envContent.match(/DATABASE_URL=(.+)/);
        if (match) {
            DATABASE_URL = match[1].trim().replace(/^["']|["']$/g, '');
        }
    } catch (e) {
        console.error('Could not read .env file');
        process.exit(1);
    }
}

if (!DATABASE_URL) {
    console.error('DATABASE_URL not found in .env files');
    process.exit(1);
}

console.log('Connecting to database...');

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function migrate() {
    try {
        // Check if columns already exist
        const checkCashAmount = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Order' 
            AND column_name = 'cashAmount';
        `);

        const checkCardAmount = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'Order' 
            AND column_name = 'cardAmount';
        `);

        // Add cashAmount if it doesn't exist
        if (checkCashAmount.rows.length === 0) {
            console.log('Adding cashAmount column...');
            await pool.query(`ALTER TABLE "Order" ADD COLUMN "cashAmount" DECIMAL;`);
            console.log('✓ Added cashAmount column');
        } else {
            console.log('✓ cashAmount column already exists');
        }

        // Add cardAmount if it doesn't exist
        if (checkCardAmount.rows.length === 0) {
            console.log('Adding cardAmount column...');
            await pool.query(`ALTER TABLE "Order" ADD COLUMN "cardAmount" DECIMAL;`);
            console.log('✓ Added cardAmount column');
        } else {
            console.log('✓ cardAmount column already exists');
        }

        console.log('\n✅ Database migration completed successfully!');
        console.log('You can now restart your dev server.');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
