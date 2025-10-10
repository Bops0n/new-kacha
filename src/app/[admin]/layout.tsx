import { getServerSession } from "next-auth";
import AdminNavbar from "./components/AdminNavbar";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (session?.user.accessLevel == 9) {
    return (
        <>
        <AdminNavbar/>
        {children}
        </>
    )
  }
}