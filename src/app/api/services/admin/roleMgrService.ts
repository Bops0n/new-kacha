import { Role } from "@/types/";
import { poolQuery } from "../../lib/db";

export async function getRoles() {
    const { rows } = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_GET"()`);
    return rows;
}

export async function addRole(role: Role, createBy: number) {
    const { rows } = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_INS"($1, $2)`, 
        [JSON.stringify(role), createBy]);
    return rows[0];
}

export async function updateRule(roleLevel: number, role: Partial<Role>, updateBy: number) {
    const { rows } = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_UPD"($1, $2, $3)`, 
        [roleLevel, JSON.stringify(role), updateBy]);
    return rows[0];
}

export async function deleteRole(roleLevel: number, deleteBy: number) {
    const { rowCount } = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_DEL"($1, $2)`, [roleLevel, deleteBy]);
    return rowCount > 0;
}

export async function getRoleByLevel(roleLevel: number) : Promise<Role> {
    const { rows } = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_ROLE_GET"($1);`, [roleLevel]);
    return rows[0];
}