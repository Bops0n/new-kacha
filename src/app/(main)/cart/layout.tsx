'use client'
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const session = useSession();
    if (session.status === 'loading'){
        return <>
        <LoadingSpinner/>
        </>
    }else if (session.status === 'unauthenticated'){
        redirect('/login');
    }
    return(
        <>

          {/* <AlertModalProvider> */}
        <div className="">
        {children}
        </div>
          {/* </AlertModalProvider> */}
        </>
    )
}