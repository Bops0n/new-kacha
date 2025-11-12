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

export async function saveSession(SID: string, AesKey: string, IP: string, User_Agent: string) {
    const { rowsCount } = await poolQuery(`SELECT * FROM "SP_AUTH_SESSION_INS"($1, $2, $3, $4)`, 
        [SID, AesKey, IP, User_Agent]);
    return rowsCount > 0;
}

export async function getSession(SID: string) {
    const { rows } = await poolQuery(`SELECT * FROM "SP_AUTH_SESSION_GET"($1)`, [SID]);
    return rows[0];
}

export async function cleanExpiredSessions() {
    const { rowsCount } = await poolQuery(`SELECT * FROM "SP_AUTH_SESSION_DEL"()`);
    return rowsCount > 0;
}