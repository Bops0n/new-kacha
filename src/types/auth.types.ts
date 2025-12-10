import { Session } from "next-auth";
import { NextResponse } from "next/server";

export interface AUTH_CHECK {
  authenticated: boolean;
  response: NextResponse | null | undefined;
  userId: number | null;
  accessLevel: number;
  session: Session | null;
}


export interface REGISTER_PARSE_DATA {
  username: string;
  email: string;
  password: string;
}