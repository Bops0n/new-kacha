import { UserAccount } from "@/types";
import { poolQuery } from "../../lib/db";

export async function getUsers() {
    const { rows } = await poolQuery(`SELECT * FROM "SP_ADMIN_USER_GET"()`);
    return rows;
}

export async function addUser(user: Omit<UserAccount, 'User_ID'>, createBy: number) {
    const { rows } = await poolQuery(`SELECT * FROM "SP_ADMIN_USER_INS"($1, $2)`, [JSON.stringify(user), createBy]);
    return rows[0];
}

export async function deleteUser(userId: number, deleteBy: number) {
    const { rowCount } = await poolQuery(`SELECT * FROM "SP_ADMIN_USER_DEL"($1, $2)`, [userId, deleteBy]);
    return rowCount > 0;
}

export async function updateUser(userId: number, userData: Partial<UserAccount>, updateBy: number) {
    const { rowCount } = await poolQuery(`SELECT * FROM "SP_ADMIN_USER_UPD"($1, $2, $3)`, 
        [userId, JSON.stringify(userData), updateBy]);
    return rowCount > 0;
}