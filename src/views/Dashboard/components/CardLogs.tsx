import { cn } from "@/lib/utils"
import { SideCard } from "./SideCard"
import { ScrollArea } from "./ScrollArea"
import { formatShowTime } from "./utils"
export function CardLogs() {
    return (
        <SideCard title="系统日志" className="pb-3">
            <ScrollArea>
                <AlertItem from="系统" text="系统启动完成" time="2026-07-30T05:20:00Z" level={0} />
                <AlertItem from="推理" text="推理完成" time="2026-07-30T05:20:00Z" level={1} />
                <AlertItem from="系统" text="系统启动完成" time="2026-07-30T05:20:00Z" level={2} />
                <AlertItem from="系统" text="系统启动完成" time="2026-07-30T05:20:00Z" level={3} />
            </ScrollArea>
        </SideCard>
    )
}

function AlertItem({ from, text, time, level }: { from: string; text: string; time: string; level: number }) {
    return (
        <div className={cn(
            "flex rounded-xs w-full items-center text-sm \
                border border-gray-3/30 animate-expand-right relative"
            , {
                "bg-gray-4/30": level === 0,
                "bg-accent/30": level === 1,
                "bg-attention-dark/30": level === 2,
                "bg-negative-dark/30": level === 3,
            })}>
            <div className={cn("flex items-center h-full px-2 font-bold", {
                "bg-gray-4/30": level === 0,
                "bg-accent/30": level === 1,
                "bg-attention-dark/30": level === 2,
                "bg-negative-dark/30": level === 3,
            })}>
                {from}
            </div>
            <div className="flex-1 px-2 py-0.5">
                {text}
            </div>
            <div className="opacity-0 hover:opacity-100 transition-opacity \
             absolute right-0 h-full w-full \
            flex justify-end items-center text-text bg-gray-4/50 \
            mask-l-from-20% mask-l-to-40%
            ">
                {formatShowTime(time)}
            </div>
        </div>
    )
}