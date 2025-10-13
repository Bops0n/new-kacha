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

    if (session.user.Dashboard) {
        redirect("/admin/dashboard");
    }

    // if (session.user.Sys_Admin) {
    //     redirect("/admin/dashboard");
    // }

    if (session.user.User_Mgr) {
        redirect("/admin/user-management");
    }

    if (session.user.Stock_Mgr) {
        redirect("/admin/product-management");
    }

    if (session.user.Order_Mgr) {
        redirect("/admin/order-management");
    }

    if (session.user.Report) {
        redirect("/admin/report");
    }
}