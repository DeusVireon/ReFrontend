import React, { useMemo } from "react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ReferenceArea,
    ReferenceLine,
    matchByDataKey,
} from "recharts"
import { useSensorData } from "../stores/SensorData"
import { usePredictResult } from "../stores/PredictResult"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// 格式化 X 轴 Tick：0 保持为 "0"，正数带 +h，负数带 h
const formatXAxisTick = (x: number) => {
    if (Math.abs(x) < 0.001) return "0"
    const formattedNum = Number(x.toFixed(1))
    return formattedNum > 0 ? `+${formattedNum}h` : `${formattedNum}h`
}

// 对应左 3h、右 6h 范围刻度
const X_AXIS_TICKS = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6]

/**
 * 1. 左侧历史数据图层（独立订阅 SensorData）
 */
function LeftHistoryArea() {
    const historyData = useSensorData(
        (state) => state.getDataByAttrKey("rto_out_conc")?.history
    )

    const leftData = useMemo(() => {
        if (!historyData || historyData.length === 0) return []
        const nowMs = Date.now()

        return historyData
            .map((item) => {
                const timeMs = new Date(item.timestamp).getTime()
                if (isNaN(timeMs)) return null

                // 计算以小时为单位的相对时间偏移量（x = 0 表示当前时间）
                const xHours = (timeMs - nowMs) / (1000 * 30) // (1000 * 60 * 60)
                return {
                    timestamp: item.timestamp, // 唯一标识，用于动画匹配
                    x: xHours,
                    leftValue: item.value,
                }
            })
            .filter((item): item is { timestamp: string; x: number; leftValue: number } => item !== null)
            .sort((a, b) => a.x - b.x)
    }, [historyData])

    return (
        <Area
            type="natural"
            data={leftData}
            dataKey="leftValue"
            name="历史值"
            stroke="var(--color-accent)"
            fill="url(#leftFill)"
            fillOpacity={0.25}
            strokeWidth={2}
            connectNulls={false}
            animationMatchBy={matchByDataKey("timestamp")}
        />
    )
}

/**
 * 2. 右侧预测数据图层（独立订阅 PredictResult）
 */
function RightPredictArea() {
    const predictResult = usePredictResult((state) => state.predictResult)

    const rightData = useMemo(() => {
        if (!predictResult?.PredSteps || !predictResult.AnchorTime) return []
        const anchorMs = new Date(predictResult.AnchorTime).getTime()
        if (isNaN(anchorMs)) return []

        const nowMs = Date.now()

        return predictResult.PredSteps
            .map((step) => {
                const stepMs = anchorMs + step.offsetMs
                const xHours = (stepMs - nowMs) / (1000 * 60 * 60)
                const pointId = `${predictResult.AnchorTime}_${step.offsetMs}`

                return {
                    timestamp: pointId, // 唯一标识，用于动画匹配
                    x: xHours,
                    rightValue: step.value,
                    errorBand: [step.lower90, step.upper90] as [number, number],
                }
            })
            .sort((a, b) => a.x - b.x)
    }, [predictResult])

    return (
        <>
            {/* 误差区域 */}
            <Area
                type="basis"
                data={rightData}
                dataKey="errorBand"
                name="误差区间"
                stroke="none"
                fill="var(--color-accent-purple)"
                fillOpacity={0.15}
                connectNulls={false}
                isAnimationActive={false}
            />
            {/* 预测主线 */}
            <Area
                type="natural"
                data={rightData}
                dataKey="rightValue"
                name="预测值"
                stroke="var(--color-accent-purple)"
                fill="none"
                strokeWidth={2}
                connectNulls={false}
                animationMatchBy={matchByDataKey("timestamp")}
            />
        </>
    )
}

const chartConfig = {}

/**
 * 3. 复合数据图层主组件
 */
export function CompDataChartN() {
    return (
        <div className="h-full w-full">
            <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <AreaChart margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid
                        vertical={false}
                        strokeDasharray="4"
                        strokeOpacity={0.4}
                    />
                    <CartesianGrid
                        horizontal={false}
                        strokeDasharray="6"
                        strokeOpacity={0.08}
                    />

                    {/* 渐变与背景区域定义 */}
                    <defs>
                        <linearGradient id="warningToNegativeGrad" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="var(--color-attention)" />
                            <stop offset="100%" stopColor="var(--color-negative)" />
                        </linearGradient>
                        <linearGradient id="leftFill" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="5%"
                                stopColor="var(--color-accent)"
                                stopOpacity={0.8}
                            />
                            <stop
                                offset="100%"
                                stopColor="var(--color-accent)"
                                stopOpacity={0.2}
                            />
                        </linearGradient>
                    </defs>

                    {/* 参考报警区间 */}
                    <ReferenceArea
                        y1={80}
                        y2={120}
                        fill="url(#warningToNegativeGrad)"
                        fillOpacity={0.08}
                        stroke="none"
                        ifOverflow="hidden"
                    />
                    <ReferenceArea
                        y1={120}
                        y2={10000}
                        fill="var(--color-negative)"
                        fillOpacity={0.08}
                        stroke="none"
                        ifOverflow="hidden"
                    />

                    {/* X 轴配置：数值型轴，范围为 [-3, 6]（左 3h，右 6h） */}
                    <XAxis
                        dataKey="x"
                        height={20}
                        type="number"
                        domain={[-3, 6]}
                        ticks={X_AXIS_TICKS}
                        tickFormatter={formatXAxisTick}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                        allowDataOverflow // 启用裁剪区域，支持移出边界的数据平滑向左推移
                    />

                    {/* Y 轴配置 */}
                    <YAxis
                        type="number"
                        width={35}
                        domain={["auto", "auto"]}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                    />

                    {/* Tooltip 配置 */}
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, payload) => {
                                    const rawTime = payload?.[0]?.payload?.x
                                    if (rawTime !== undefined && rawTime !== null) {
                                        return `相对时间: ${formatXAxisTick(Number(rawTime))}`
                                    }
                                    return ""
                                }}
                                formatter={(value) => {
                                    const formatNum = (v: string | number) => {
                                        const num = Number(v)
                                        return isNaN(num) ? v : num.toFixed(2)
                                    }

                                    if (Array.isArray(value)) {
                                        return value.map(formatNum).join(" ~ ")
                                    }
                                    return formatNum(Number(value))
                                }}
                            />
                        }
                    />

                    {/* 挂载独立的左右数据图层组件 */}
                    <LeftHistoryArea />
                    <RightPredictArea />

                    {/* 当前时间（x=0）分割参考线 */}
                    <ReferenceLine
                        x={0}
                        stroke="var(--color-accent-light)"
                        strokeOpacity={0.5}
                        strokeWidth={2}
                    />
                    {/* Y=80 阈值线 */}
                    <ReferenceLine
                        y={80}
                        stroke="var(--color-attention)"
                        strokeOpacity={0.5}
                        strokeWidth={2}
                        ifOverflow="discard"
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    )
}