'use client'
import AccessDeniedPage from "@/app/components/AccessDenied";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
    const { data: session, status } = useSession();

    if (status == "loading") return <LoadingSpinner />;
    if (!session || !session.user.Dashboard) return <AccessDeniedPage />;

    return (
        <div className="min-h-screen bg-base-200 p-4">
            <div className="max-w-7xl mx-auto">
                <div>Dashboard</div>
            </div>
        </div>
    )
}