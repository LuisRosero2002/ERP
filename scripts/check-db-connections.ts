import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL!;

async function checkConnections() {
    const pool = new Pool({ connectionString });

    try {
        const result = await pool.query(`
            SELECT 
                count(*) as total_connections,
                count(*) FILTER (WHERE state = 'active') as active_connections,
                count(*) FILTER (WHERE state = 'idle') as idle_connections,
                count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
            FROM pg_stat_activity 
            WHERE datname = current_database();
        `);

        console.log('Database Connection Stats:');
        console.log(result.rows[0]);

        // Check for long-running transactions
        const longRunning = await pool.query(`
            SELECT 
                pid,
                now() - xact_start as duration,
                state,
                query
            FROM pg_stat_activity
            WHERE state != 'idle'
                AND xact_start IS NOT NULL
                AND now() - xact_start > interval '5 seconds'
            ORDER BY duration DESC;
        `);

        if (longRunning.rows.length > 0) {
            console.log('\nLong-running transactions (>5s):');
            console.log(longRunning.rows);
        } else {
            console.log('\nNo long-running transactions found.');
        }

    } catch (error) {
        console.error('Error checking connections:', error);
    } finally {
        await pool.end();
    }
}

checkConnections();
