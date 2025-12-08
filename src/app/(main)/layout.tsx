// import { AlertModalProvider } from "..//AlertModalContext";
import { Metadata } from "next";
import { getWebsiteSettings } from "../api/services/website/settingService";
import { CartCountProvider } from "../context/CartCount";
import UserNavbar from "./components/UserNavbar";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getWebsiteSettings();

  return {
    title: settings.siteName || "",
    keywords: settings.siteKeywords,
    description: settings.siteDescription || "",
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return(
      <>
        <CartCountProvider>
          <UserNavbar/>
          {/* <AlertModalProvider> */}
          <div>
            {children}
          </div>
          {/* </AlertModalProvider> */}
        </CartCountProvider>
      </>
  )
}