import { cn } from "@/lib/utils"
import { SideCard } from "./SideCard"
import { ScrollArea } from "./ScrollArea"
import { formatShowTime } from "./utils"
import { useShallow } from 'zustand/react/shallow';
import { useLogData } from "../stores/LogData"
import { ClockArrowLeft } from "lucide-react"
import { memo } from "react"
export function CardDCA() {
    const logs = useLogData(useShallow((state) => state.idList));
    return (
        <SideCard title="DCA 监控" className="pb-3">
            <ScrollArea>
                <div className="flex flex-wrap gap-1 items-center">
                    <div className="font-bold text-lg">状态：</div>
                    <DCAStatusItem name="慢车" color="#6684fb" />
                    <DCAStatusItem name="维护" color="#6684fb" />
                    <DCAStatusItem name="半停机" color="#a10033" />
                    {/* <DCAStatusItem name="系统慢车" color="#0000aa" />
                    <DCAStatusItem name="系统慢车" color="#0000aa" />
                    <DCAStatusItem name="系统慢车" color="#0000aa" /> */}
                </div>
                <div className="py-1"><div className="h-px w-full bg-gray-7/50" /></div>
                <DCAInfoItem typeName="自回归" info="峰值偏移 +13.4%" />
                <DCAInfoItem typeName="自回归" info="正常" />
                <DCAInfoItem typeName="相关性" info="正常" />
                <DCAInfoItem typeName="相关性" info="正常" />
                <DCAInfoItem typeName="相关性" info="正常" />
            </ScrollArea>
        </SideCard>
    )
}

function DCAStatusItem({ name, color }: { name: string, color: string }) {
    return (
        <div className="h-fit w-fit px-2 rounded-xs border"
            style={{
                backgroundColor: `${color}80`,
                borderColor: `${color}bf`,
            }}>
            {name}
        </div>
    )
}

function DCAInfoItem({ typeName, info }: { typeName: string, info: string }) {
    return (
        <div className=" \
                rounded-xs px-1 py-0.5 items-center leading-normal">
            <span className="inline-flex px-1.5 w-fit mr-1.5 \
                rounded-full border text-sm bg-accent-purple/50 border-accent-purple/75">
                {typeName}
            </span>
            <span className="">{info}</span>
        </div>
    )
}

// const LogItemMemo = memo(LogItem)

// function LogItem(id: { id: number }) {
//     const log = useLogData(useShallow((state) => state.logByID[id.id]));

//     if (!log) {
//         return null;
//     }

//     return (
//         <div className={cn(
//             "flex rounded-xs w-full items-center text-sm \
//                 border border-gray-3/30 animate-expand-right relative"
//             , {
//                 "bg-gray-4/30": log.level === 0,
//                 "bg-accent/30": log.level === 1,
//                 "bg-attention-dark/30": log.level === 2,
//                 "bg-negative-dark/30": log.level === 3,
//             })}>
//             <div className={cn("flex items-center h-full px-2 font-bold", {
//                 "bg-gray-4/30": log.level === 0,
//                 "bg-accent/30": log.level === 1,
//                 "bg-attention-dark/30": log.level === 2,
//                 "bg-negative-dark/30": log.level === 3,
//             })}>
//                 {log.name}
//             </div>
//             <div className="flex-1 px-2 py-0.5">
//                 {log.content}
//             </div>
//             <div className="opacity-0 hover:opacity-100 transition-opacity \
//              absolute right-0 h-full w-full \
//             flex justify-end items-center text-text bg-gray-4/50 \
//             mask-l-from-20% mask-l-to-40%
//             ">
//                 {formatShowTime(log.triggerTime)}
//             </div>
//         </div>
//     )
// }