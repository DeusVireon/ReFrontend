import { TriangleAlert, CircleCheck } from "lucide-react"
import { SideCard } from "./SideCard"
import { DCAStackedBar, DCAStatusBadge } from "./DCAStackedBar"
import { DCADetailDialog } from "./DCADetailDialog"
import { useDCAData } from "../stores/DCAData"
import {
    DCA_APPLICABILITY_LABELS,
    getDcaScoreLevel,
    type DCAPredictionApplicability,
} from "../models/DCA"

export function CardDCA() {
    const snapshot = useDCAData((state) => state.snapshot)

    return (
        <SideCard
            title="DCA 监控"
            className="pb-3"
            headerAction={<DCADetailDialog snapshot={snapshot} />}
        >
            {snapshot ? (
                <div className="flex h-full min-h-0 flex-col gap-1.5 pt-0.5 text-sm">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <div className="text-xs text-gray-7">当前 DCA 反常度</div>
                            <div className="flex items-baseline gap-1">
                                <span className="font-mono text-2xl font-semibold leading-none tabular-nums 2xl:text-3xl">
                                    {snapshot.score.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-7">/ 100</span>
                            </div>
                        </div>
                        <ApplicabilityLabel applicability={snapshot.predictionApplicability} />
                    </div>

                    <div>
                        <div className="mb-1 flex items-center justify-between text-xs text-gray-7">
                            <span>规则得分构成</span>
                            <span className="flex">{snapshot.score.toFixed(1)}
                            </span>
                        </div>
                        <DCAStackedBar
                            rules={snapshot.rules}
                        />
                    </div>

                    <div className="mt-auto min-h-0 border-t border-theme-1/30 pt-1.5">
                        {/* <div className="mb-1 flex items-center justify-between text-xs text-gray-7">
                            <span>当前状态</span>
                            <span>持续 {snapshot.sustainedMinutes} min</span>
                        </div> */}
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none items-center">
                            <div className="font-bold text-md">生效状态</div>
                            <div>{snapshot.statuses.length > 0 ? snapshot.statuses.map((status) => (
                                <DCAStatusBadge key={status.id} label={status.label} level={status.level} />
                            )) : (
                                <DCAStatusBadge
                                    label="未识别到工况状态"
                                    level={getDcaScoreLevel(snapshot.score, snapshot.scoreThreshold)}
                                />
                            )}</div>
                        </div>
                    </div>
                </div>
            ) : (
                <DCAEmptyState />
            )}
        </SideCard>
    )
}

function ApplicabilityLabel({
    applicability,
}: {
    applicability: DCAPredictionApplicability
}) {
    const Icon = applicability === "reliable" ? CircleCheck : TriangleAlert
    const colorClass = applicability === "reliable"
        ? "text-positive"
        : applicability === "limited"
            ? "text-attention"
            : "text-negative"

    return (
        <div className={`flex max-w-44 items-center gap-1 text-right text-xs ${colorClass}`}>
            <Icon className="size-3.5 shrink-0" />
            <span>{DCA_APPLICABILITY_LABELS[applicability]}</span>
        </div>
    )
}

function DCAEmptyState() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-gray-7">
            <span className="animate-pulse">等待 DCA 实时分析数据</span>
        </div>
    )
}
