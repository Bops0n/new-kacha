import { getServerSession } from "next-auth";
import AdminNavbar from "./components/AdminNavbar";
import RestrictedComponent from "./components/RestrictedComponent";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions)
  console.log('testsession', session)
  
  if (session?.user.accessLevel == "9")
    return(
        <>
        <AdminNavbar/>
        {children}
        </>
    )
  else if (session === null || session?.user.accessLevel != "9"){
    return redirect('/404')
  }
}