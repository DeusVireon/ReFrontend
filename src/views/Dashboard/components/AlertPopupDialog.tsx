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
import { useSound } from 'use-sound'
import { useAlertPopupStore } from "@/views/Dashboard/stores/AlertPopup"


export function AlertPopupDialog() {
    const [open, setOpen] = useState(false)
    const [alert1] = useSound('/sounds/Alert1.mp3');
    const [alert2] = useSound('/sounds/Alert2.mp3');
    const [alert3] = useSound('/sounds/Alert3.mp3');

    const popupData = useAlertPopupStore((state) => state.currentPopup)
    useEffect(() => {
        if (popupData) {
            setOpen(true)
            const level = popupData.level;
            if (level === 1) {
                alert1();
            } else if (level === 2) {
                alert2();
            } else if (level === 3) {
                alert3();
            }
        }

    }, [popupData])

    const [animKey, setAnimKey] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    // 鼠标进入：进入悬停状态（进度条保持 100% 满格）
    const handleMouseEnter = () => {
        setIsHovered(true);
    };
    // 鼠标离开：重置 Key，强制重新加载 CSS 动画节点
    const handleMouseLeave = () => {
        setIsHovered(false);
        setAnimKey((prev) => prev + 1);
    };

    const handleOpenChange = (newOpenState: boolean) => {
        setOpen(newOpenState)
    }

    console.log(isHovered, animKey, 'isHovered, animKey')

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {/* 直接给 DialogTrigger 加上按钮样式，不使用 asChild 嵌套 */}
            <DialogTrigger>
                查看详细信息
            </DialogTrigger>

            <DialogContent key={popupData?.triggerTime}
                onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
                className="animate-slide-down-fade bg-theme-2/75 rounded-md p-5 \
                top-12 left-1/2 -translate-x-1/2 translate-y-0">

                <div className="absolute top-0 left-0 px-1 h-1  w-full">
                    {!isHovered ? (
                        <div
                            key={animKey}
                            className="origin-left rounded-full h-full w-full bg-negative animate-countdown-bar"
                            style={{ "--duration": "20s" } as React.CSSProperties}
                            onAnimationEnd={() => setOpen(false)} // 动画播放完毕后触发关闭
                        />
                    ) : (
                        /* 鼠标悬停时显示满格进度条 */
                        <div className="h-full w-full bg-negative" />
                    )}
                </div>


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