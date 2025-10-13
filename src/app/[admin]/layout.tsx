'use server'
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import AdminNavbar from "./components/AdminNavbar";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }
  
  if (session?.user?.accessLevel != 0 && session?.user.accessLevel !== undefined) {
    return (
      <>
        <div className="w-full min-h-screen bg-base-200" data-theme="dark">
          <AdminNavbar/>
          {children}
        </div>
      </>
    )
  }
}