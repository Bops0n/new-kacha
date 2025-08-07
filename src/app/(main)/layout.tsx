// import { AlertModalProvider } from "..//AlertModalContext";
import { CartCountProvider } from "../context/CartCount";
import UserNavbar from "./components/UserNavbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return(
        <>
        <CartCountProvider>
        <UserNavbar/>
          {/* <AlertModalProvider> */}
        <div className="45">
        {children}
        </div>
          {/* </AlertModalProvider> */}
        </CartCountProvider>
        </>
    )
}