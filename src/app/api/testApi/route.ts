import { NextRequest, NextResponse } from 'next/server'
// import  { testD }  from '../lib/admin-sql'
// import { poolQuery } from '../lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { NextApiResponse } from 'next'
import { User } from '@/types'

export async function POST(req : NextRequest, res : NextApiResponse){
    // console.log(poolQuery('SELECt ()'))
    // testD()
    const user : User = await req.json()
    const k = await getServerSession(authOptions)
    console.log(user)
    return NextResponse.json({test:'test',status:200})


};