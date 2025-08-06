import { NextRequest, NextResponse } from 'next/server'
// import  { testD }  from '../lib/admin-sql'
// import { poolQuery } from '../lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { NextApiResponse } from 'next'
import { User } from '@/types/types'
import { poolQuery } from '../../lib/db'
import { useStyleRegistry } from 'styled-jsx'

export async function POST(req : NextRequest, res : NextApiResponse){
    const user : User = await req.json()

    const sql =
    `UPDATE public."User"
        SET
            "Username" = '${user.Username}',
            "Password" = '${user.Password}',
            "Full_Name" = '${user.Full_Name}',
            "Email" = '${user.Email}',
            "Phone" = ${user.Phone ? `'${user.Phone}'` : 'NULL'},
            "Access_Level" = '${user.Access_Level}',
            "Token" = ${user.Token ? `'${user.Token}'` : 'NULL'}
        WHERE
            "User_ID" = ${user.User_ID};`

    const result = await poolQuery(sql)

    console.log(result)

    // console.log(result.row)
    
    console.log(user)
    return NextResponse.json({test:'test',status:200})


};