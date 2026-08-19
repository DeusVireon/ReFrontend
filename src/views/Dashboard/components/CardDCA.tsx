import { SideCard } from "./SideCard"
import { useDCAData } from "../stores/DCAData"

export function CardDCA() {
    const snapshot = useDCAData((state) => state.snapshot)
    const scorePercent = Math.min(100, Math.max(0, snapshot?.score ?? 0))
    const thresholdPercent = Math.min(100, Math.max(0, snapshot?.scoreThreshold ?? 0))
    const thresholdReached = snapshot ? snapshot.score >= snapshot.scoreThreshold : false

    return (
        <SideCard
            title="DCA 总分"
            className="pb-3"
        >
            {snapshot ? (
                <div className="flex h-full min-h-0 flex-col gap-3 pt-0.5 text-sm">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <div className="text-xs text-gray-7">当前总分</div>
                            <div className="flex items-baseline gap-1">
                                <span className="font-mono text-2xl font-semibold leading-none tabular-nums 2xl:text-3xl">
                                    {snapshot.score.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-7">/ 100</span>
                            </div>
                        </div>
                        <span className={thresholdReached ? "whitespace-nowrap text-xs font-semibold text-negative" : "whitespace-nowrap text-xs font-semibold text-positive"}>
                            {thresholdReached ? "告警" : "未告警"}
                        </span>
                    </div>

                    <div>
                        <div className="relative h-3 overflow-hidden rounded-sm bg-gray-4/25" aria-label={`DCA 总分 ${snapshot.score.toFixed(1)}，告警阈值 ${snapshot.scoreThreshold.toFixed(1)}`}>
                            <div
                                className={thresholdReached ? "h-full bg-negative" : "h-full bg-accent"}
                                style={{ width: `${scorePercent}%` }}
                            />
                            <div
                                className="absolute inset-y-0 w-0.5 bg-text/80"
                                style={{ left: `${thresholdPercent}%` }}
                            />
                        </div>
                        <div className="mt-1 flex justify-between text-xs text-gray-7">
                            <span>0</span>
                            <span>告警阈值 {snapshot.scoreThreshold.toFixed(1)}</span>
                            <span>100</span>
                        </div>
                    </div>

                    <div className="mt-auto border-t border-theme-1/30 pt-2 text-xs text-gray-7">
                        更新时间 {formatTime(snapshot.updatedAt)}
                    </div>
                </div>
            ) : (
                <DCAEmptyState />
            )}
        </SideCard>
    )
}

function DCAEmptyState() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-gray-7">
            <span className="animate-pulse">等待 DCA 总分数据</span>
        </div>
    )
}

function formatTime(value: string): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "未知"
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}
