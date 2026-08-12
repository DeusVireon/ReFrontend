import {
    Area,
    CartesianGrid,
    ComposedChart,
    Line,
    ReferenceArea,
    XAxis,
    YAxis,
} from 'recharts'
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart'
import { useShallow } from 'zustand/react/shallow'
import { FIELD_META_MAP, SERIES_COLORS } from '../models/AnalyzeTypes'
import { useAnalyzeData } from '../stores/AnalyzeData'

function formatAxisTime(iso: string) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
}

export function TrendChart() {
    const { series, selectedKeys, highlight } = useAnalyzeData(useShallow((s) => ({
        series: s.series,
        selectedKeys: s.selectedKeys,
        highlight: s.highlight,
    })))

    const chartData = series.map((point) => ({
        timestamp: point.timestamp,
        ...point.values,
    }))

    const chartConfig: ChartConfig = {}
    for (let i = 0; i < selectedKeys.length; i++) {
        const key = selectedKeys[i]!
        chartConfig[key] = {
            label: FIELD_META_MAP[key]?.label ?? key,
            color: SERIES_COLORS[i % SERIES_COLORS.length]!,
        }
    }

    const hasHighlight = Boolean(highlight.start && highlight.end)

    return (
        <div className="h-72 w-full md:h-80">
            <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="4" strokeOpacity={0.35} />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={formatAxisTime}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={48}
                        height={24}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        tickMargin={4}
                    />
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, payload) => {
                                    const ts = payload?.[0]?.payload?.timestamp
                                    if (!ts) return null
                                    return new Date(ts).toLocaleString('zh-CN', { hour12: false })
                                }}
                            />
                        }
                    />

                    {hasHighlight ? (
                        <ReferenceArea
                            x1={highlight.start!}
                            x2={highlight.end!}
                            fill="var(--color-attention)"
                            fillOpacity={0.18}
                            stroke="var(--color-attention)"
                            strokeOpacity={0.45}
                        />
                    ) : null}

                    {selectedKeys.map((key, i) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={FIELD_META_MAP[key]?.label ?? key}
                            stroke={SERIES_COLORS[i % SERIES_COLORS.length]!}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    ))}

                    {/* 用透明 Area 占位，确保空数据时坐标轴仍可渲染 */}
                    {selectedKeys.length === 0 ? (
                        <Area dataKey="__none" stroke="none" fill="none" />
                    ) : null}
                </ComposedChart>
            </ChartContainer>
        </div>
    )
}
