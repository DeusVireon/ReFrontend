import { ChartNoAxesCombined, LayoutDashboard } from "lucide-react"
import { NavLink } from "react-router"
import { cn } from "@/lib/utils"

const pageItems = [
    {
        to: "/",
        label: "孪生监控",
        shortLabel: "监控",
        icon: LayoutDashboard,
        end: true,
    },
    {
        to: "/analyze",
        label: "数据分析",
        shortLabel: "分析",
        icon: ChartNoAxesCombined,
        end: false,
    },
] as const

/**
 * Header-level page navigation. Keeping it isolated allows deployments with a
 * single dashboard page to remove the switch without changing HeaderBar.
 */
export function HeaderPageNavigation() {
    return (
        <nav
            aria-label="看板页面切换"
            className="flex shrink-0 items-center rounded-md border border-theme-5/55 \
            bg-theme-2/50 p-1 backdrop-blur-md h-10 gap-1"
        >
            {pageItems.map(({ to, label, shortLabel, icon: Icon, end }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={label}
                    className={({ isActive }) => cn(
                        "relative flex h-8 min-w-10 items-center justify-center gap-2 rounded-sm px-2 \
                        text-xs font-semibold whitespace-nowrap transition-[color,background-color,box-shadow] \
                        duration-200 focus-visible:outline-2 \
                        focus-visible:outline-offset-2 focus-visible:outline-accent",
                        isActive
                            ? "bg-theme-3/50 text-white"
                            : "text-gray-7 hover:bg-theme-3/75 hover:text-text",
                    )}
                >
                    {({ isActive }) => (
                        <>
                            <Icon className="size-4 shrink-0" strokeWidth={isActive ? 2.4 : 2} />
                            <span className="hidden min-[1180px]:inline">{label}</span>
                            <span className="hidden min-[760px]:inline min-[1180px]:hidden">{shortLabel}</span>
                            <span
                                aria-hidden
                                className={cn(
                                    "absolute inset-x-2 -bottom-1 h-px origin-center bg-accent transition-transform duration-200",
                                    isActive ? "scale-x-100" : "scale-x-0",
                                )}
                            />
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    )
}
