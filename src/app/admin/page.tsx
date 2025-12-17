'use client'
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner";
import { useEffect } from "react";

export default function AdminPage() {
    const { data: session, status } = useSession();
    const { replace } = useRouter();
    
    useEffect(() => {
        
        if (status !== "authenticated") return;

        if (!session?.user) {
            replace("/");
            return;
        }

        let url = "/";

        if (session.user.Dashboard)         url = "/admin/dashboard";
        else if (session.user.User_Mgr)     url = "/admin/user-management";
        else if (session.user.Stock_Mgr)    url = "/admin/product-management";
        else if (session.user.Order_Mgr)    url = "/admin/order-management";
        else if (session.user.Report)       url = "/admin/report";

        replace(url);

    }, [status, session, replace]);

    return <LoadingSpinner />;
}