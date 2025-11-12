const { logger } = require('@/server/logger');
const { Pool } = require('pg');
require("dotenv").config();

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    // ssl: {
    //     rejectUnauthorized: true,
    //     ca: process.env.DB_CACERT,
    // },
};

const pool = new Pool(config);


module.exports = {
    poolQuery : async (queryString, params) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const res = await client.query(queryString, params);

            await client.query('COMMIT');

            return res;
        } catch (dbError) {
            await client.query('ROLLBACK');
            logger.error('Database Error:', dbError.message, '\nQuery:', queryString);
            throw dbError;
        } finally {
            client.release();
        }
    }
}