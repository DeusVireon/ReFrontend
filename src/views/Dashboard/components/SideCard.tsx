import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DashboardCardProps {
    /** 卡片标题 */
    title?: string
    /** 卡片内部千变万化的子组件 */
    children: ReactNode
    /** 允许外部传入 class 微调容器（如 Grid 布局跨行跨列 `col-span-2` 或自定义高度） */
    className?: string
    floatingTitle?: boolean
}

export function SideCard({
    title,
    children,
    className,
    floatingTitle = false,
}: DashboardCardProps) {
    return (
        <div className={cn(
            "w-full h-full p-4 pt-2.5 rounded-md flex flex-col gap-1.5 overflow-hidden \
            border-[1.5px] border-theme-1/20 bg-theme-2/50 text-text",
            className
        )}>
            {/* 固定的 Title 区 */}
            {title && (
                <div className={cn("font-semibold text-xl flex",
                    { "absolute": floatingTitle }
                )}>
                    {title}
                </div>
            )}
            {/* 可变的 Children 区 */}
            <div className="h-full w-full overflow-hidden">
                {children}
            </div>
        </div>
    )
}