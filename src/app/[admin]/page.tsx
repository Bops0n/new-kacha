'use client'
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminPage() {
    const { data: session, status } = useSession();

    if (status == "loading") {
        return <LoadingSpinner />;
    }

    
    if (!session) {
        redirect("/");
    }

    let URL = "/";

    if (session.user.Dashboard) {
        URL = "/admin/dashboard";
    }
    else if (session.user.User_Mgr) {
        URL = "/admin/user-management";
    } 
    else if (session.user.Stock_Mgr) {
        URL = "/admin/product-management";
    }
    else if (session.user.Order_Mgr) {
        URL = "/admin/order-management";
    }
    else if (session.user.Report) {
        URL = "/admin/report";
    }

    redirect(URL);
}