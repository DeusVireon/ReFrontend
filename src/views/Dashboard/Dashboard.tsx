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
import { useEffect } from "react"

export function DashboardView() {
    useEffect(() => {
        document.documentElement.classList.add("dashboard-light")
        return () => document.documentElement.classList.remove("dashboard-light")
    }, [])

    return <div className="dashboard-light relative h-screen w-screen overflow-hidden bg-theme-7 text-text">
        <div className="isolate"><ModelView /></div>
        <BottomCardGroup />
        <RightCardGroup />
        <LeftToolZone />
    </div>
}

function LeftToolZone() {
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
                <VerticalToggleGroup />
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
