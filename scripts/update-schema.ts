import { execSync } from 'child_process';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

try {
    console.log('Pushing schema changes to database...');
    execSync('bunx prisma db push', {
        stdio: 'inherit',
        env: process.env
    });
    console.log('\nGenerating Prisma Client...');
    execSync('bunx prisma generate', {
        stdio: 'inherit',
        env: process.env
    });
    console.log('\nDatabase schema updated successfully!');
} catch (error) {
    console.error('Schema push failed:', error);
    process.exit(1);
}
