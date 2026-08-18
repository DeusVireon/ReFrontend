import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    XAxis,
    YAxis,
} from "recharts"
import { ChevronDown, Clock3, Gauge, Maximize2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DCA_APPLICABILITY_LABELS,
    DCA_RULE_KIND_LABELS,
    getDcaScoreLevel,
    type DCARuleResult,
    type DCASnapshot,
} from "../models/DCA"
import { DCAStackedBar, DCAStatusBadge } from "./DCAStackedBar"

const SCORE_CHART_CONFIG = {
    score: { label: "异常分数", color: "var(--color-accent-cyan)" },
} satisfies ChartConfig

const RULE_CHART_CONFIG = {
    value: { label: "观测值", color: "var(--color-accent-cyan)" },
    baseline: { label: "参考值", color: "var(--color-accent-purple)" },
} satisfies ChartConfig

export function DCADetailDialog({
    snapshot,
    children,
}: {
    snapshot: DCASnapshot | null
    children?: ReactNode
}) {
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)

    useEffect(() => {
        if (!snapshot?.rules.length) {
            setSelectedRuleId(null)
            return
        }
        setSelectedRuleId((current) => (
            current && snapshot.rules.some((rule) => rule.id === current)
                ? current
                : snapshot.rules[0]?.id ?? null
        ))
    }, [snapshot])

    return (
        <Dialog>
            <DialogTrigger
                disabled={!snapshot}
                render={
                    <Button
                        variant="ghost"
                        size="xs"
                        className="text-gray-7 hover:text-text"
                        aria-label="查看 DCA 监控详情"
                    />
                }
            >
                {children ?? (
                    <>
                        <Maximize2 />
                        <span className="hidden 2xl:inline">查看详情</span>
                    </>
                )}
            </DialogTrigger>
            <DialogContent className="h-[82vh] w-[calc(100vw-2rem)] max-w-[1280px] gap-0 overflow-hidden border-theme-1/35 bg-theme-2/92 p-0 text-text shadow-2xl sm:w-[78vw] sm:max-w-[78vw]">
                <DialogHeader className="border-b border-theme-1/30 px-5 py-4 pr-12">
                    <DialogTitle className="text-xl font-semibold">DCA 动态耦合分析</DialogTitle>
                    <DialogDescription>
                        评估当前工况与历史规律的一致性，并标注预测结果的适用边界。
                    </DialogDescription>
                </DialogHeader>

                {snapshot ? (
                    <div className="h-full overflow-y-auto px-5 py-4">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
                            <section className="min-w-0">
                                <SectionTitle title="当前规则得分构成" subtitle="点击色块可定位对应规则" />
                                <DCAStackedBar
                                    rules={snapshot.rules}
                                    selectedRuleId={selectedRuleId}
                                    onSelectRule={setSelectedRuleId}
                                    size="detail"
                                />
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <DCAStatusBadge
                                        label={`异常分数 ${snapshot.score.toFixed(1)}`}
                                        level={getDcaScoreLevel(snapshot.score, snapshot.scoreThreshold)}
                                    />
                                    {snapshot.statuses.map((status) => (
                                        <DCAStatusBadge key={status.id} label={status.label} level={status.level} />
                                    ))}
                                </div>
                                <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                                    <SummaryMetric
                                        icon={<ShieldCheck />}
                                        label="预测适用性"
                                        value={DCA_APPLICABILITY_LABELS[snapshot.predictionApplicability]}
                                    />
                                    <SummaryMetric
                                        icon={<Gauge />}
                                        label="持续时间"
                                        value={`${snapshot.sustainedMinutes} min`}
                                    />
                                    <SummaryMetric
                                        icon={<Clock3 />}
                                        label="数据更新时间"
                                        value={formatTime(snapshot.updatedAt)}
                                    />
                                </div>
                            </section>

                            <section className="min-w-0">
                                <SectionTitle title="24 小时异常分数" subtitle={`持续告警线 ${snapshot.scoreThreshold.toFixed(0)} 分`} />
                                <ScoreHistoryChart snapshot={snapshot} />
                            </section>
                        </div>

                        <section className="mt-5 border-t border-theme-1/30 pt-4">
                            <SectionTitle
                                title="规则明细"
                                subtitle="规则分数是偏离历史工况的量化结果，不表示异常概率"
                            />
                            <div className="space-y-2 pb-6">
                                {snapshot.rules.map((rule) => (
                                    <RuleDetailItem
                                        key={rule.id}
                                        rule={rule}
                                        selected={rule.id === selectedRuleId}
                                        onSelect={() => setSelectedRuleId(rule.id)}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-7">
                        等待 DCA 数据
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="font-semibold">{title}</h3>
            <span className="text-xs text-gray-7">{subtitle}</span>
        </div>
    )
}

function SummaryMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
    return (
        <div className="flex min-w-0 items-center gap-2 border-l-2 border-accent/60 bg-theme-1/25 px-3 py-2">
            <span className="text-accent-light [&_svg]:size-4">{icon}</span>
            <span className="min-w-0">
                <span className="block text-xs text-gray-7">{label}</span>
                <span className="block truncate font-medium" title={value}>{value}</span>
            </span>
        </div>
    )
}

function ScoreHistoryChart({ snapshot }: { snapshot: DCASnapshot }) {
    const domain = useMemo(() => {
        const scores = snapshot.scoreHistory.map((point) => point.score)
        if (scores.length === 0) return [0, Math.max(10, snapshot.scoreThreshold)] as [number, number]
        const min = Math.max(0, Math.floor(Math.min(...scores) - 5))
        const max = Math.ceil(Math.max(...scores, snapshot.scoreThreshold) + 5)
        return [min, max] as [number, number]
    }, [snapshot.scoreHistory, snapshot.scoreThreshold])

    if (snapshot.scoreHistory.length === 0) {
        return <EmptyChart label="暂无 24 小时分数记录" />
    }

    return (
        <ChartContainer config={SCORE_CHART_CONFIG} className="h-45 w-full aspect-auto">
            <LineChart data={snapshot.scoreHistory} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="4" strokeOpacity={0.25} />
                <XAxis
                    dataKey="offsetHours"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value === 0 ? "现在" : `${value}h`}
                    minTickGap={24}
                />
                <YAxis domain={domain} tickLine={false} axisLine={false} width={36} />
                <ReferenceLine
                    y={snapshot.scoreThreshold}
                    stroke="var(--color-attention)"
                    strokeDasharray="5 4"
                />
                <ChartTooltip
                    content={<ChartTooltipContent labelFormatter={(value) => `${value} 小时`} />}
                />
                <Line
                    dataKey="score"
                    name="score"
                    type="monotone"
                    stroke="var(--color-accent-cyan)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                />
            </LineChart>
        </ChartContainer>
    )
}

function RuleDetailItem({
    rule,
    selected,
    onSelect,
}: {
    rule: DCARuleResult
    selected: boolean
    onSelect: () => void
}) {
    return (
        <details
            className={`group rounded-sm border bg-theme-1/20 transition-colors ${selected ? "border-accent/70" : "border-theme-1/30"}`}
            onToggle={(event) => {
                if (event.currentTarget.open) onSelect()
            }}
        >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
                <DCAStatusBadge label={DCA_RULE_KIND_LABELS[rule.kind]} level={rule.status} />
                <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{rule.name}</span>
                    <span className="block truncate text-xs text-gray-7">{rule.summary}</span>
                </span>
                <span className="font-mono text-sm tabular-nums">+{rule.score.toFixed(1)}</span>
                <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid gap-4 border-t border-theme-1/25 px-3 py-3 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
                <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] content-start gap-x-3 gap-y-2 text-sm">
                    <dt className="text-gray-7">关联变量</dt>
                    <dd className="break-words font-mono text-xs">{rule.sensorKeys.join(", ") || "未配置"}</dd>
                    <dt className="text-gray-7">评估窗口</dt>
                    <dd>{rule.window}</dd>
                    <dt className="text-gray-7">判定条件</dt>
                    <dd>{rule.condition}</dd>
                    <dt className="text-gray-7">当前 / 参考</dt>
                    <dd className="font-mono tabular-nums">
                        {rule.currentValue.toFixed(2)} / {rule.referenceValue.toFixed(2)} {rule.unit}
                    </dd>
                    <dt className="text-gray-7">规则得分</dt>
                    <dd className="font-mono tabular-nums">{rule.score.toFixed(2)}</dd>
                </dl>
                <RuleHistoryChart rule={rule} />
            </div>
        </details>
    )
}

function RuleHistoryChart({ rule }: { rule: DCARuleResult }) {
    if (rule.history.length === 0) {
        return <EmptyChart label="该规则暂无历史序列" />
    }

    return (
        <div className="min-w-0">
            <div className="mb-1 text-xs text-gray-7">近时段观测与参考</div>
            <ChartContainer config={RULE_CHART_CONFIG} className="h-28 w-full aspect-auto">
                <LineChart data={rule.history} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="4" strokeOpacity={0.2} />
                    <XAxis
                        dataKey="offsetHours"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value === 0 ? "现在" : `${value}h`}
                        minTickGap={20}
                    />
                    <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} width={38} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line dataKey="baseline" name="baseline" type="monotone" stroke="var(--color-accent-purple)" strokeDasharray="4 3" dot={false} isAnimationActive={false} />
                    <Line dataKey="value" name="value" type="monotone" stroke="var(--color-accent-cyan)" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
            </ChartContainer>
        </div>
    )
}

function EmptyChart({ label }: { label: string }) {
    return (
        <div className="flex h-28 items-center justify-center border border-dashed border-theme-1/35 text-xs text-gray-7">
            {label}
        </div>
    )
}

function formatTime(value: string): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "未知"
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}
