import { SideCard } from "./components/SideCard"
import { ModelView } from "./ModelView/ModelView"
import { CardSourceStatus } from "./components/CardSourceStatus"
import { CardSysStatus } from "./components/CardSysStatus"
import { CardForecast } from "./components/CardForecast"
import { CardLogs } from "./components/CardLogs"
import { CardAlerts } from "./components/CardAlerts"
import { ToolAISug } from "./components/ToolAISug"
import { VerticalToggleGroup } from './components/ToolPartSelector';
import { CardDCA } from "./components/CardDCA"
import { useEffect, useState } from "react"
import {
    DASHBOARD_THEME_STORAGE_KEY,
    type DashboardTheme,
} from "./theme"

export function DashboardView() {
    const [theme, setTheme] = useState<DashboardTheme>(() => {
        if (typeof window === "undefined") return "light"
        return window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY) === "dark"
            ? "dark"
            : "light"
    })

    useEffect(() => {
        const root = document.documentElement
        root.classList.toggle("dashboard-light", theme === "light")
        root.classList.toggle("dashboard-dark", theme === "dark")
        root.style.colorScheme = theme
        window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, theme)

        return () => {
            root.classList.remove("dashboard-light", "dashboard-dark")
            root.style.removeProperty("color-scheme")
        }
    }, [theme])

    const toggleTheme = () => setTheme((current) => current === "light" ? "dark" : "light")

    return <div className={`${theme === "light" ? "dashboard-light" : "dashboard-dark"} relative h-screen w-screen overflow-hidden bg-theme-25 text-text`}>
        <div className="isolate"><ModelView theme={theme} /></div>
        <BottomCardGroup />
        <RightCardGroup />
        <LeftToolZone theme={theme} onThemeToggle={toggleTheme} />
    </div>
}

function LeftToolZone({
    theme,
    onThemeToggle,
}: {
    theme: DashboardTheme
    onThemeToggle: () => void
}) {
    return (
        <div>
            <div className="absolute top-20 left-0 w-1/2 h-[20vh] px-2">
                <CardLogs />
            </div>
            <div className="absolute bottom-[25vh] max-h-[70vh] left-22 pb-4 \
                        flex gap-2">
                <ToolAISug />
            </div>
            <div className="absolute bottom-[25vh] left-0 pb-4 pl-6 flex">
                <VerticalToggleGroup theme={theme} onThemeToggle={onThemeToggle} />
            </div>
        </div>

    )
}

function BottomCardGroup() {
    return <div className="absolute bottom-0 left-0 w-full h-[25vh] pb-6 px-6 \
                         grid grid-cols-5 gap-2">
        <SideCard title="数据源">
            <CardSourceStatus />
        </SideCard>
        <SideCard title="系统状态">
            <CardSysStatus />
        </SideCard>
        <div className="col-span-3 overflow-hidden">
            <CardForecast />
        </div>
    </div>
}

function RightCardGroup() {
    return <div className="absolute top-16 right-0 w-[25vw] h-[calc(75vh-4rem-1rem)] pr-6 \
                         grid grid-rows-5 gap-2">
        <div className="row-span-3"><CardAlerts /></div>
        <div className="row-span-2">
            <CardDCA />
        </div>
    </div>
}
