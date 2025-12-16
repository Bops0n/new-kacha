'use server'
import { getServerSession } from "next-auth";
import AdminNavbar from "./components/AdminNavbar";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getWebsiteSettings } from "../api/services/website/settingService";
import { authOptions } from "../api/auth/[...nextauth]/options";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getWebsiteSettings();

  return {
    title: settings.siteName.concat(' | ADMIN CONSOLE') || "",
    keywords: settings.siteKeywords,
    description: settings.siteDescription || "",
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  
  if (session.user.accessLevel === 0) redirect("/");

  return (
    <div className="w-full min-h-screen bg-base-200" data-theme="dark">
      <AdminNavbar />
      {children}
    </div>
  );
}