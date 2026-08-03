import { cn } from "@/lib/utils"
import { SideCard } from "./SideCard"
import { ScrollArea } from "./ScrollArea"
import { formatShowTime } from "./utils"
import { useShallow } from 'zustand/react/shallow';
import { useLogData } from "../stores/LogData"
import { memo } from "react"
export function CardLogs() {
    const logs = useLogData(useShallow((state) => state.idList));
    return (
        <SideCard title="系统日志" className="pb-3">
            <ScrollArea>
                {logs.map((id) => (
                    <LogItemMemo key={id} id={id} />
                ))}
            </ScrollArea>
        </SideCard>
    )
}

const LogItemMemo = memo(LogItem)

function LogItem(id: { id: number }) {
    const log = useLogData(useShallow((state) => state.logByID[id.id]));

    if (!log) {
        return null;
    }

    return (
        <div className={cn(
            "flex rounded-xs w-full items-center text-sm \
                border border-gray-3/30 animate-expand-right relative"
            , {
                "bg-gray-4/30": log.level === 0,
                "bg-accent/30": log.level === 1,
                "bg-attention-dark/30": log.level === 2,
                "bg-negative-dark/30": log.level === 3,
            })}>
            <div className={cn("flex items-center h-full px-2 font-bold", {
                "bg-gray-4/30": log.level === 0,
                "bg-accent/30": log.level === 1,
                "bg-attention-dark/30": log.level === 2,
                "bg-negative-dark/30": log.level === 3,
            })}>
                {log.name}
            </div>
            <div className="flex-1 px-2 py-0.5">
                {log.content}
            </div>
            <div className="opacity-0 hover:opacity-100 transition-opacity \
             absolute right-0 h-full w-full \
            flex justify-end items-center text-text bg-gray-4/50 \
            mask-l-from-20% mask-l-to-40%
            ">
                {formatShowTime(log.triggerTime)}
            </div>
        </div>
    )
}