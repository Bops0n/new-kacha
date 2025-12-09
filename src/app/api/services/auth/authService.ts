import { hmacMd5Hex } from "@/server/cryptor";
import { poolQuery } from "../../lib/db";

export async function signIn(username: string, password: string) {
    const { rows } = await poolQuery(`SELECT * FROM public."SP_AUTH_LOGIN"($1, $2);`, 
        [username, hmacMd5Hex(password, process.env.SALT_SECRET)]);
    return rows[0];
}

export async function signUp(username: string, email: string, password: string) {
    const { rows } = await poolQuery(`SELECT * FROM "SP_AUTH_REGISTER"($1, $2, $3)`, 
        [username, email, hmacMd5Hex(password, process.env.SALT_SECRET)]);
    return rows[0];
}