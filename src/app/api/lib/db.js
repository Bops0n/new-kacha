const { Pool } = require('pg');
require("dotenv").config();
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    idleTimeoutMillis: 30000,
    // database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: true,
        ca: process.env.DB_CACERT,
    },
};

const pool = new Pool(config);

// export default pool

module.exports = {
    poolQuery : (queryString, params) => pool.query(queryString,params)
}
// console.log(poolQuery('SELECT ()'));