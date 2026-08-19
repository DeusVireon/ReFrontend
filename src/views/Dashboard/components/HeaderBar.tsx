import { useEffect, useRef, useState } from "react"
import { ChevronRight, CircleCheck, OctagonAlert, Settings, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRefClock } from "@/stores/ReferenceClock"
import { useOverallStatus } from "../stores/OverallStatus"
import { HeaderPageNavigation } from "./HeaderPageNavigation"

export function HeaderBar({ showNavigation = true }: { showNavigation?: boolean }) {
    const overallStatus = useOverallStatus((state) => state.overallStatus)

    return (
        <header className="pointer-events-none absolute inset-x-0 top-0 z-40 h-24 text-text">
            <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-theme-1/90 via-theme-1/55 via-65% to-theme-1/0 backdrop-blur-[2px]"
            />

            <div className="pointer-events-auto absolute left-0 top-0 z-20 w-fit">
                <TitleArea />
            </div>

            <div className="pointer-events-auto relative z-10 flex h-16 items-center gap-1.5 pr-2 pl-20 min-[1024px]:gap-3 min-[1024px]:pr-6 min-[1024px]:pl-[21.5rem]">
                <div className="flex min-w-0 items-center gap-1.5 min-[1024px]:gap-2.5">
                    {showNavigation ? <HeaderPageNavigation /> : null}
                    <TimeArea />
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1 min-[1024px]:gap-2">
                    <StatusBadge name="监测" description={overallStatus.bizPrompt} status={overallStatus.bizStatus} />
                    <StatusBadge name="系统" description={overallStatus.sysPrompt} status={overallStatus.sysStatus} />
                    <SettingsButton />
                </div>
            </div>

            <div
                aria-hidden
                className="absolute top-16 right-2 h-px w-[calc(100%-6rem)] bg-linear-to-r from-transparent via-theme-5/55 to-transparent min-[1024px]:right-6 min-[1024px]:w-[calc(100%-23rem)]"
            />
        </header>
    )
}

function TitleArea() {
    return (
        <div className="flex items-center gap-3 rounded-br-full bg-theme-1/70 px-2 pb-1 pr-3 mask-b-from-70% mask-b-to-100% mask-r-from-80% mask-r-to-100% min-[1024px]:px-4 min-[1024px]:pb-2 min-[1024px]:pr-12">
            <img
                src="/system-logo.png"
                alt="System Logo"
                className="size-16 min-[1024px]:size-20"
            />
            <div className="hidden min-[1024px]:block">
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
    const [timeMs, setTimeMs] = useState(() => useRefClock.getState().getTime())
    const lastRenderedSecond = useRef(Math.floor(timeMs / 1000))
    const speed = useRefClock((state) => state.refClockSpeed)

    useEffect(() => {
        let frameId = 0

        const updateClock = () => {
            const nextTime = useRefClock.getState().getTime()
            const nextSecond = Math.floor(nextTime / 1000)

            // The frame loop follows accelerated playback, while React only
            // renders when the displayed second actually changes.
            if (nextSecond !== lastRenderedSecond.current) {
                lastRenderedSecond.current = nextSecond
                setTimeMs(nextTime)
            }
            frameId = requestAnimationFrame(updateClock)
        }

        frameId = requestAnimationFrame(updateClock)
        return () => cancelAnimationFrame(frameId)
    }, [])

    const time = new Date(timeMs)
    const hours = String(time.getHours()).padStart(2, "0")
    const minutes = String(time.getMinutes()).padStart(2, "0")
    const seconds = String(time.getSeconds()).padStart(2, "0")
    const date = time.toLocaleDateString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
    })

    return (
        <div
            className="relative flex h-10 min-w-[9.5rem] shrink-0 items-center overflow-hidden rounded-md border border-theme-5/65 bg-linear-to-b from-theme-3/90 via-theme-2/90 to-theme-1/90 px-2 font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.11),inset_0_-8px_16px_rgba(0,0,0,0.18),0_8px_20px_rgba(0,0,0,0.2)] min-[1024px]:h-12 min-[1024px]:min-w-[12.25rem] min-[1024px]:px-3"
            aria-label={`参考时钟 ${hours}:${minutes}:${seconds}`}
        >
            <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 bg-accent shadow-[0_0_10px_rgba(105,115,255,0.8)]" />
            <div className="relative z-10 w-full">
                <div className="mb-0.5 hidden items-center justify-between text-[9px] leading-none tracking-[0.16em] text-gray-7 min-[1024px]:flex">
                    <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-positive shadow-[0_0_7px_rgba(80,220,180,0.9)]" />
                        REF CLOCK
                    </span>
                    <span className="tracking-normal">
                        {date}{speed === 1 ? "" : ` · ×${formatClockSpeed(speed)}`}
                    </span>
                </div>
                <div className="flex items-center justify-center text-[1.15rem] leading-none font-bold tracking-[0.02em] text-white [text-shadow:0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(76,90,220,0.4)] min-[1024px]:justify-start min-[1024px]:text-[1.55rem] min-[1024px]:tracking-[0.08em]">
                    <ClockDigits value={hours} segment="hour" />
                    <ClockSeparator />
                    <ClockDigits value={minutes} segment="minute" />
                    <ClockSeparator />
                    <ClockDigits value={seconds} segment="second" />
                </div>
            </div>
            <span aria-hidden className="absolute inset-x-4 bottom-0 h-px bg-linear-to-r from-transparent via-accent/80 to-transparent" />
        </div>
    )
}

function ClockDigits({ value, segment }: { value: string; segment: string }) {
    return (
        <span className="inline-flex tabular-nums">
            {Array.from(value).map((digit, index) => (
                <span key={`${segment}-${index}-${digit}`} className="inline-grid w-[0.72em] place-items-center overflow-hidden">
                    <span className="animate-clock-digit-roll">{digit}</span>
                </span>
            ))}
        </span>
    )
}

function ClockSeparator() {
    return <span aria-hidden className="mx-0.5 -translate-y-px text-accent-light/80">:</span>
}

function formatClockSpeed(speed: number) {
    return Number.isInteger(speed) ? speed.toFixed(0) : speed.toFixed(1)
}

function SettingsButton() {
    return (
        <button
            type="button"
            aria-label="打开设置"
            className="flex h-8 items-center gap-0.5 rounded-sm border border-theme-5/55 bg-theme-2/55 px-1.5 text-xs font-bold whitespace-nowrap transition-colors hover:border-theme-5/85 hover:bg-theme-3/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent min-[1024px]:gap-1 min-[1024px]:px-2 min-[1024px]:text-sm"
        >
            <Settings className="size-4" strokeWidth={2.25} />
            <span className="hidden min-[1120px]:inline">设置</span>
            <ChevronRight className="size-3.5" strokeWidth={2.25} />
        </button>
    )
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
        <div
            role="status"
            aria-label={`${name}状态${description ? `：${description}` : ""}`}
            className={cn("flex h-8 items-center rounded-sm px-1.5 text-xs whitespace-nowrap backdrop-blur-sm min-[1024px]:px-2 min-[1024px]:text-sm",
            {
                "bg-positive-dark/50 border border-positive-dark/75": status === 1,
                "bg-attention-dark/50 border border-attention-dark/75": status === 0,
                "bg-negative-dark/50 border border-negative-dark/75": status === -1,
            }
        )}
        >
            {Icon && <Icon className="mr-1 size-4 shrink-0" strokeWidth={2.25} />}
            <div className={cn("font-bold",
                {
                    "min-[1240px]:pr-2": description !== "",
                })
            }>{name}</div>
            {description ? <span className="hidden min-[1240px]:inline">{description}</span> : null}
        </div >
    )
}
