import { AccessInfo } from "@/types/";
import { poolQuery } from "../../lib/db";

export async function getAccesses() {
    const { rows } = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_GET"()`);
    return rows;
}

export async function addAccess(access: AccessInfo, createBy: number) {
    const { rows } = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_INS"($1, $2)`, 
        [JSON.stringify(access), createBy]);
    return rows[0];
}

export async function updateAccess(level: number, access: AccessInfo, updateBy: number) {
    const { rows } = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_UPD"($1, $2, $3)`, 
        [level, JSON.stringify(access), updateBy]);
    return rows[0];
}

export async function deleteAccess(level: number, deleteBy: number) {
    const { rowCount } = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_DEL"($1, $2)`, [level, deleteBy]);
    return rowCount !== null && rowCount > 0;
}

export async function getAccessByLevel(level: number) : Promise<AccessInfo> {
    const { rows } = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_GET"($1);`, [level]);
    return rows[0];
}