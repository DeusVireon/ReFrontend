import { cn } from "@/lib/utils"
import { SideCard } from "./SideCard"
import { ScrollArea } from "./ScrollArea"
import { formatShowTime } from "./utils"
export function CardAlerts() {
    return (
        <SideCard title="告警列表" className="pb-3">
            <ScrollArea>
                <AlertItem title="浓度达到 80mg/m^3" body="10" time="2026-07-30T05:20:00Z" level={0} />
                <AlertItem title="浓度达到 80mg/m^3" body="10" time="2026-07-30T05:20:00Z" level={3} />
                <AlertItem title="浓度达到 80mg/m^3" body="10" time="2026-07-30T05:20:00Z" level={2} />
                <AlertItem title="浓度达到 80mg/m^3" body="10" time="2026-07-30T05:20:00Z" level={1} />
            </ScrollArea>
        </SideCard>
    )
}

function AlertItem({ title, body, time, level }: { title: string; body: string; time: string; level: number }) {

    let levelText

    switch (level) {
        case 0:
            levelText = "INFO"
            break
        case 1:
            levelText = "IMPORTANT"
            break
        case 2:
            levelText = "WARNING"
            break
        case 3:
            levelText = "CRITICAL"
            break
        default:
            levelText = "UNDEFINED LEVEL"
    }

    return (
        <div className={cn(
            "flex rounded-xs w-full \
                border border-gray-3/30 animate-expand-right"
            , {
                "bg-gray-4/30": level === 0,
                "bg-accent/30": level === 1,
                "bg-attention-dark/30": level === 2,
                "bg-negative-dark/30": level === 3,
            })}>
            <div className={cn("w-1", {
                "bg-gray-7": level === 0,
                "bg-accent-light": level === 1,
                "bg-attention": level === 2,
                "bg-negative": level === 3,
            })}></div>
            <div className="flex-row w-full px-2 py-1">
                <div className="flex justify-between text-xs text-gray-7">
                    <div>{levelText}</div>
                    <div>{formatShowTime(time)}</div>
                </div>
                <div className="flex">
                    <div className="font-semibold">{title}</div>
                </div>
            </div>
        </div>
    )
}

