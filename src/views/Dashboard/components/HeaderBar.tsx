import { cn } from "@/lib/utils"
import { CircleCheck, TriangleAlert, OctagonAlert, ChevronRight, Settings } from "lucide-react"
import { useState, useEffect } from 'react';
import { useOverallStatus } from "../stores/OverallStatus";
import { useRefClock } from "@/stores/ReferenceClock";
export function HeaderBar() {
    const overallStatus = useOverallStatus((state) => state.overallStatus);
    return (
        <div>
            <div className="absolute top-0 left-0 w-full h-16 \
        bg-linear-to-b from-theme-1/75 via-theme-1/20 via-75% to-theme-1/0 \
        text-text flex justify-between">
                <div className="flex py-2.5 pl-90"><TimeArea /></div>
                <div className="flex py-3 pr-6 gap-4">
                    <StatusBadge name="监测" description={overallStatus.bizPrompt} status={overallStatus.bizStatus} />
                    <StatusBadge name="系统" description={overallStatus.sysPrompt} status={overallStatus.sysStatus} />
                    <SettingsButton />
                </div>

            </div>
            <div className="flex w-fit text-text"><TitleArea /></div>
        </div>
    );
}

function TitleArea() {
    return (
        <div className="flex items-center px-4 pb-2 pr-12 rounded-br-full gap-4 bg-theme-2/40 \
        mask-b-from-70% mask-b-to-100% \
        mask-r-from-80% mask-r-to-100%">
            <img src="/system-logo.png"
                alt="System Logo"
                className="size-20 " />
            <div className="">
                <div className="flex">
                    <div className="italic text-4xl font-bold text-accent">Deus</div>
                    <div className="italic text-4xl font-bold">Vireon</div>
                </div>
                <div className="-mt-1">
                    化工园区数字监控看板
                </div>
            </div>
        </div>
    )
}

function TimeArea() {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        // 首次加载获取初始时间
        setTime(useRefClock.getState().getDateObj());

        // 每秒更新一次状态
        const timer = setInterval(() => {
            setTime(useRefClock.getState().getDateObj());
        }, 1000);

        // 组件卸载时清理定时器，防止内存泄漏
        return () => clearInterval(timer);
    }, []);

    if (!time) return null;
    const timeString = time.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return (
        <div className="grid grid-rows-2 text-text font-mono">
            <div className="text-4xl font-bold tracking-widest">
                {timeString}
            </div>
            <div className="bg-accent/50 z-10 w-full h-2 mt-0.5" />
        </div>
    );
}

function SettingsButton() {
    return (
        <div className="flex h-fit w-fit px-2 py-0.5 pr-0 rounded-xs \
        bg-theme-2/25 border border-theme-2/50 hover:bg-theme-2/50 hover:border-theme-2/75 \
        font-bold">
            <Settings className="py-0.75 pr-1" strokeWidth={2.5} />
            设置
            <ChevronRight className="py-0.75" strokeWidth={2.5} />
        </div>
    );
}

function StatusBadge({ name, description, status }: { name: string, description: string, status: number }) {
    let Icon
    switch (status) {
        case 1:
            Icon = CircleCheck
            break;
        case 0:
            Icon = TriangleAlert
            break;
        case -1:
            Icon = OctagonAlert
            break;
        default:
            break;
    }
    return (
        <div className={cn("flex h-fit w-fit px-2 py-0.5 rounded-xs",
            {
                "bg-positive-dark/50 border border-positive-dark/75": status === 1,
                "bg-attention-dark/50 border border-attention-dark/75": status === 0,
                "bg-negative-dark/50 border border-negative-dark/75": status === -1,
            }
        )}>
            {Icon && <Icon className="py-0.75 pr-1" strokeWidth={2.5} />}
            <div className={cn("font-bold",
                {
                    "pr-2": description !== "",
                })
            }>{name}</div>
            {description}
        </div >
    );
}