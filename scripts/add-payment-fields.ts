import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL!;

async function addMixedPaymentFields() {
    const pool = new Pool({ connectionString });

    try {
        console.log('Adding cashAmount and cardAmount columns to Order table...');

        // Check if columns already exist
        const checkCashAmount = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='Order' AND column_name='cashAmount';
        `);

        const checkCardAmount = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='Order' AND column_name='cardAmount';
        `);

        // Add cashAmount if it doesn't exist
        if (checkCashAmount.rows.length === 0) {
            await pool.query(`
                ALTER TABLE "Order" 
                ADD COLUMN "cashAmount" DECIMAL;
            `);
            console.log('✓ Added cashAmount column');
        } else {
            console.log('✓ cashAmount column already exists');
        }

        // Add cardAmount if it doesn't exist
        if (checkCardAmount.rows.length === 0) {
            await pool.query(`
                ALTER TABLE "Order" 
                ADD COLUMN "cardAmount" DECIMAL;
            `);
            console.log('✓ Added cardAmount column');
        } else {
            console.log('✓ cardAmount column already exists');
        }

        console.log('\n✅ Database schema updated successfully!');
        console.log('Now regenerating Prisma Client...');

    } catch (error) {
        console.error('❌ Error updating schema:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

addMixedPaymentFields();
