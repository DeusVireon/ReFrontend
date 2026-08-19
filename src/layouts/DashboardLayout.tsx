import { Outlet } from "react-router"
import { HeaderBar } from "@/views/Dashboard/components/HeaderBar"

export function DashboardLayout() {
    return (
        <div>
            <Outlet />
            <HeaderBar />
        </div>
    )
}
