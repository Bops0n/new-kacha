import UserNavbar from "./components/UserNavbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return(
        <>
        <UserNavbar/>
        {children}
        </>
    )
}