import { execSync } from 'child_process';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

try {
    console.log('Running Prisma migration...');
    execSync('bunx prisma migrate dev --name add_mixed_payment_fields', {
        stdio: 'inherit',
        env: process.env
    });
    console.log('Migration completed successfully!');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
}
