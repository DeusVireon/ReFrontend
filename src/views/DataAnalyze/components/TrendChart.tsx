import { useId } from 'react'
import {
    Area,
    AreaChart,
    Brush,
    CartesianGrid,
    ReferenceArea,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { useShallow } from 'zustand/react/shallow'
import { FIELD_META_MAP, SERIES_COLORS } from '../models/AnalyzeTypes'
import { useAnalyzeData } from '../stores/AnalyzeData'

function formatAxisTime(iso: string) {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return iso
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
}

function formatValue(value: unknown) {
    const number = Number(value)
    return Number.isFinite(number) ? number.toFixed(2) : '—'
}

function resolveHighlightBounds(
    timestamps: string[],
    start: string | null,
    end: string | null,
): { start: string; end: string } | null {
    if (!start || !end || timestamps.length === 0) return null
    const samples = timestamps
        .map((timestamp, index) => ({ index, time: Date.parse(timestamp) }))
        .filter((sample) => Number.isFinite(sample.time))
    const rawStart = Date.parse(start)
    const rawEnd = Date.parse(end)
    if (!samples.length || !Number.isFinite(rawStart) || !Number.isFinite(rawEnd)) return null

    const nearestIndex = (target: number) =>
        samples.reduce((nearest, sample) =>
            Math.abs(sample.time - target) < Math.abs(nearest.time - target) ? sample : nearest,
        ).index

    let startIndex = nearestIndex(Math.min(rawStart, rawEnd))
    let endIndex = nearestIndex(Math.max(rawStart, rawEnd))
    if (startIndex > endIndex) [startIndex, endIndex] = [endIndex, startIndex]
    if (startIndex === endIndex && timestamps.length > 1) {
        if (endIndex < timestamps.length - 1) endIndex += 1
        else startIndex -= 1
    }
    return { start: timestamps[startIndex]!, end: timestamps[endIndex]! }
}

export function TrendChart() {
    const id = useId().replace(/:/g, '')
    const { series, selectedKeys, highlight } = useAnalyzeData(
        useShallow((state) => ({
            series: state.series,
            selectedKeys: state.selectedKeys,
            highlight: state.highlight,
        })),
    )
    const chartData = series.map((point) => ({
        timestamp: point.timestamp,
        ...point.values,
    }))
    const highlightBounds = resolveHighlightBounds(
        series.map((point) => point.timestamp),
        highlight.start,
        highlight.end,
    )

    return (
        <div className="h-[360px] w-full md:h-[430px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 16, right: 28, left: 4, bottom: 4 }}>
                    <defs>
                        <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
                            <feGaussianBlur stdDeviation="2.8" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <linearGradient id={`${id}-highlight`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-attention)" stopOpacity="0.5" />
                            <stop offset="65%" stopColor="var(--color-attention)" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="var(--color-attention)" stopOpacity="0.02" />
                        </linearGradient>
                        {selectedKeys.map((key, index) => (
                            <linearGradient key={key} id={`${id}-${key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={SERIES_COLORS[index % SERIES_COLORS.length]} stopOpacity="0.48" />
                                <stop offset="55%" stopColor={SERIES_COLORS[index % SERIES_COLORS.length]} stopOpacity="0.13" />
                                <stop offset="100%" stopColor={SERIES_COLORS[index % SERIES_COLORS.length]} stopOpacity="0" />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid stroke="var(--color-gray-4)" strokeOpacity={0.28} strokeDasharray="4 5" vertical={false} />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={formatAxisTime}
                        stroke="var(--color-gray-7)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={48}
                        height={28}
                    />
                    <YAxis
                        yAxisId="left"
                        stroke="var(--color-gray-7)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={46}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="var(--color-gray-7)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={46}
                    />
                    <Tooltip
                        labelFormatter={(label) => new Date(String(label)).toLocaleString('zh-CN', { hour12: false })}
                        formatter={(value, name) => {
                            const meta = FIELD_META_MAP[String(name)]
                            return [`${formatValue(value)} ${meta?.unit ?? ''}`, meta?.label ?? String(name)]
                        }}
                        contentStyle={{
                            background: 'var(--glass-background)',
                            color: 'var(--color-text)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 10,
                            boxShadow: 'var(--glass-shadow)',
                            backdropFilter: 'blur(16px)',
                        }}
                    />

                    {highlightBounds ? (
                        <ReferenceArea
                            key={`${highlightBounds.start}-${highlightBounds.end}-${highlight.revision ?? 0}`}
                            className="analyze-highlight-area"
                            x1={highlightBounds.start}
                            x2={highlightBounds.end}
                            yAxisId="left"
                            fill={`url(#${id}-highlight)`}
                            stroke="var(--color-attention)"
                            strokeOpacity={0.72}
                            ifOverflow="extendDomain"
                        />
                    ) : null}

                    {selectedKeys.map((key, index) => {
                        const rightAxis = key.includes('temp')
                        const color = SERIES_COLORS[index % SERIES_COLORS.length]!
                        return (
                            <Area
                                key={key}
                                yAxisId={rightAxis ? 'right' : 'left'}
                                type="monotone"
                                dataKey={key}
                                name={key}
                                stroke={color}
                                strokeWidth={2.6}
                                fill={`url(#${id}-${key})`}
                                fillOpacity={1}
                                filter={`url(#${id}-glow)`}
                                activeDot={{ r: 5, strokeWidth: 0, fill: '#fff' }}
                                connectNulls
                                isAnimationActive
                                animationDuration={650}
                            />
                        )
                    })}

                    <Brush
                        dataKey="timestamp"
                        height={34}
                        stroke="var(--color-accent)"
                        fill="var(--color-theme-2)"
                        travellerWidth={13}
                        tickFormatter={() => ''}
                        className="liquid-glass-brush"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
