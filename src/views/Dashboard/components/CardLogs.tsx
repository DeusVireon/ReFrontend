import { cn } from "@/lib/utils"
import { SideCard } from "./SideCard"
import { ScrollArea } from "./ScrollArea"
import { formatShowTime } from "./utils"
import { useShallow } from 'zustand/react/shallow';
import { useLogData } from "../stores/LogData"
import { memo, useState, useEffect } from "react"
export function CardLogs() {
    const logs = useLogData(useShallow((state) => state.idList));
    return (
        <LogArea>
            {logs.map((id) => (
                <LogItemMemo key={id} id={id} />
            ))}
        </LogArea>
    )
}

const LogItemMemo = memo(LogItem)

function LogItem(id: { id: number }) {
    const log = useLogData(useShallow((state) => state.logByID[id.id]));
    const removeLog = useLogData(useShallow((state) => state.removeLog));
    const [isFading, setIsFading] = useState(false);

    if (!log) {
        return null;
    }

    useEffect(() => {
        // 触发渐退样式 (opacity -> 0)
        const fadeTimer = setTimeout(() => {
            setIsFading(true);
        }, 4000);

        // 移除组件
        const removeTimer = setTimeout(() => {
            removeLog(log.id);
        }, 4500);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, [log.id, removeLog]);

    return (
        <div className={cn(
            "flex rounded-xs w-fit items-center text-sm \
                border border-gray-3/30 animate-expand-right relative \
                min-w-70 pr-8  mask-r-from-80% mask-r-to-100% \
                transition-all duration-500 ease-in-out transform "
            , {
                "bg-gray-4/50": log.level === 0,
                "bg-theme-3/50": log.level === 1,
                "bg-attention-dark/50": log.level === 2,
                "bg-negative-dark/50": log.level === 3,
                'opacity-0 overflow-hidden': isFading,
            })}>
            <div className={cn("flex items-center h-full px-2 font-bold", {
                "bg-gray-4/50": log.level === 0,
                "bg-theme-3/50": log.level === 1,
                "bg-attention-dark/50": log.level === 2,
                "bg-negative-dark/50": log.level === 3,
            })}>
                {log.name}
            </div>
            <div className="flex-1 px-2 py-1">
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

function LogArea({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full h-full overflow-hidden \
             text-text
             mask-b-from-80% mask-b-to-100% \
             mask-r-from-90% mask-r-to-100%">
            <div className="flex flex-col py-1.5 gap-0.5 w-full h-full">
                {children}
            </div >
        </div>
    )
}
