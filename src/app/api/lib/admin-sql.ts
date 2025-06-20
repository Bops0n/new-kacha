import { poolQuery } from "./db";

export function testD(){
    console.log(poolQuery('SELECT ()'))
} 

testD()
