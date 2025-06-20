import { pool } from './lib/db' 

async function runTest(){
    console.log(await pool.query('SELECT ()'))
}

await runTest()