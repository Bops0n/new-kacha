import { logger } from '@/server/logger';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    // ssl: {
    //     rejectUnauthorized: true,
    //     ca: process.env.DB_CACERT,
    // },
});

export const poolQuery = async (queryString: string, params?: unknown[]) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const res = await client.query(queryString, params);

        await client.query('COMMIT');

        return res;
    } catch (dbError) {
        await client.query('ROLLBACK');
        logger.error('Database Error:', { error: dbError });
        logger.error('Query:', { query: queryString });
        throw dbError;
    } finally {
        client.release();
    }
}