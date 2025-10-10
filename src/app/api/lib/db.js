const { Pool } = require('pg');
require("dotenv").config();

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    idleTimeoutMillis: 30000,
    // database: process.env.DB_NAME,
    // ssl: {
    //     rejectUnauthorized: true,
    //     ca: process.env.DB_CACERT,
    // },
};

const pool = new Pool(config);


module.exports = {
    pool,
    poolQuery : async (queryString, params) => {
        const client = await pool.connect();
        try {
            const res = await client.query(queryString, params);
            return res;
        } finally {
            client.release();
        }
    }
}
// console.log(poolQuery('SELECT ()'));