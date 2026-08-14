import { cn } from "@/lib/utils"
import { SideCard } from "./SideCard"
import { ScrollArea } from "./ScrollArea"
import { formatShowTime } from "./utils"
import { useShallow } from 'zustand/react/shallow';
import { useAlertData } from "../stores/AlertData"
import { memo } from "react"
import { AlertPopupDialog } from "./AlertPopupDialog"

export function CardAlerts() {

    const alerts = useAlertData(useShallow((state) => state.idList));

    return (
        <SideCard title="告警列表" className="pb-3">
            <ScrollArea>
                {alerts.map((id) => (
                    <AlertItemMemo key={id} id={id} />
                ))}
                <AlertPopupDialog />
            </ScrollArea>
        </SideCard>
    )
}

const AlertItemMemo = memo(AlertItem)

function AlertItem({ id }: { id: number }) {
    const alert = useAlertData(useShallow((state) => state.alertByID[id]));

    if (!alert) {
        return null;
    }

    let levelText

    switch (alert.level) {
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
                "bg-gray-4/30": alert.level === 0,
                "bg-accent/30": alert.level === 1,
                "bg-attention-dark/30": alert.level === 2,
                "bg-negative-dark/30": alert.level === 3,
            })}>
            <div className={cn("w-1", {
                "bg-gray-7": alert.level === 0,
                "bg-accent-light": alert.level === 1,
                "bg-attention": alert.level === 2,
                "bg-negative": alert.level === 3,
            })}></div>
            <div className="flex-row w-full px-2 py-1">
                <div className="flex justify-between text-xs text-gray-7">
                    <div>{levelText}</div>
                    <div>{formatShowTime(alert.triggerTime)}</div>
                </div>
                <div className="flex">
                    <div className="font-semibold">{alert.title}</div>
                </div>
                <div className="flex">
                    <div className="text-sm">{alert.content}</div>
                </div>
            </div>
        </div>
    )
}

