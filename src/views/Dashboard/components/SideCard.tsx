import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DashboardCardProps {
    /** 卡片标题 */
    title?: ReactNode
    /** 卡片内部千变万化的子组件 */
    children: ReactNode
    /** 允许外部传入 class 微调容器（如 Grid 布局跨行跨列 `col-span-2` 或自定义高度） */
    className?: string
    floatingTitle?: boolean
    headerAction?: ReactNode
}

export function SideCard({
    title,
    children,
    className,
    floatingTitle = false,
    headerAction,
}: DashboardCardProps) {
    return (
        <div className={cn(
            "dashboard-surface w-full h-full p-4 pt-2.5 rounded-md flex flex-col gap-1.5 overflow-hidden \
            border-[1.5px] border-theme-1/20 bg-theme-2/50 text-text backdrop-blur-md \
            ring-1 ring-theme-9/15",
            className
        )}>
            {/* 固定的 Title 区 */}
            {title && (
                <div className={cn("flex shrink-0 items-center justify-between gap-2 font-semibold text-xl",
                    { "absolute": floatingTitle }
                )}>
                    <span className="min-w-0 truncate">{title}</span>
                    {headerAction && <span className="shrink-0">{headerAction}</span>}
                </div>
            )}
            {/* 可变的 Children 区 */}
            <div className="h-full w-full overflow-hidden">
                {children}
            </div>
        </div>
    )
}
