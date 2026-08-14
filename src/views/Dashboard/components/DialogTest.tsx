import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ForecastChart } from "./SensorDataChart"
import { useEffect, useRef, useState } from "react"
import { useAlertPopupStore } from "@/views/Dashboard/stores/AlertPopup"


export function AlertPopupDialog() {
    const [open, setOpen] = useState(false)

    const popupData = useAlertPopupStore((state) => state.currentPopup)
    useEffect(() => {
        if (popupData)
            setOpen(true)
    }, [popupData])

    // 处理弹窗关闭时的状态清理
    const handleOpenChange = (newOpenState: boolean) => {
        setOpen(newOpenState)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {/* 直接给 DialogTrigger 加上按钮样式，不使用 asChild 嵌套 */}
            <DialogTrigger>
                查看详细信息
            </DialogTrigger>

            <DialogContent className="bg-theme-2/75 rounded-md p-5 \
            top-12 left-1/2 -translate-x-1/2 translate-y-0">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <div className="bg-negative/50 rounded-sm border border-negative-dark/50 \
                         px-1.5 mr-1.5 font-bold text-lg">
                            {popupData?.type}
                        </div>
                        <div className="text-2xl font-bold">{popupData?.title}</div>
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-row gap-2 w-150 ">
                    <div className="flex flex-col gap-3 w-fit py-1">
                        <LevelColorBlock title="警报级别"
                            content={popupData?.levelText ?? '未知'}
                            level={popupData?.level ?? 0} />
                        <LevelColorBlock title={popupData?.keyValueTitle ?? '未知'}
                            content={popupData?.keyValueContent ?? '未知'}
                            level={popupData?.keyValueColor ?? 0} />
                    </div>
                    <ForecastChart />
                </div>
            </DialogContent>
        </Dialog>
    )
}

interface LevelColorBlockProps {
    title: string;
    content: string;
    level: number;
    className?: string;
}

export function LevelColorBlock({ title, content, level, className }: LevelColorBlockProps) {
    const levelColors: Record<number, string> = {
        1: 'bg-accent/50',
        2: 'bg-attention/50',
        3: 'bg-negative/50'
    };

    const levelBorderColors: Record<number, string> = {
        1: 'border-accent',
        2: 'border-attention-dark',
        3: 'border-negative-dark'
    };

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-md py-2 text-white w-35 \
                border',
                levelColors[level] ?? 'bg-gray-4',
                levelBorderColors[level] ?? 'border-gray-4',
                className
            )}
        >
            <span className="text-md">
                {title}
            </span>
            <span className="text-3xl font-bold tracking-wider">
                {content}
            </span>
        </div>
    );
}