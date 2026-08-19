import { SideCard } from "./SideCard"
import { useMemo, useState, useEffect } from "react"
import GaugeComponent from 'react-gauge-component'
import { usePredictResult } from "../stores/PredictResult"
import { useSensorData } from "../stores/SensorData"
import { CompDataChartN } from "./SensorDataChart"
import { formatShowTime } from "./utils"
import {
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    ReferenceLine,
    ReferenceArea,
} from "recharts"
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
export function CardForecast() {
    const predictResult = usePredictResult((state) => state.predictResult)
    const maxExceedProb = predictResult?.MaxExceedProb ?? -1
    const inputDataQuantity = predictResult?.InputDataQuantity ?? -1
    return (
        <SideCard title="预测" floatingTitle={true}>
            <div className="grid grid-cols-5 gap-2 text-sm">
                <div className="col-span-2 grid grid-rows-4 gap-2 overflow-hidden">
                    <div className="flex row-span-1 pl-16 items-center ">
                        <ForecastTime anchorTime={predictResult?.AnchorTime} />
                        {/* <div className="w-fit h-fit p-1 px-3 rounded-sm text-gray-7">
                            数据量 120w
                        </div> */}
                    </div>
                    <div className="row-span-3 flex">
                        <MaxRiskGauge value={maxExceedProb} />
                        <DataQualityGauge value={inputDataQuantity} />
                    </div>
                </div>
                <div className="col-span-3 overflow-hidden">
                    <CompDataChartN />
                </div>
            </div>
        </SideCard>
    )
}

function ForecastTime({ anchorTime }: { anchorTime: string | undefined }) {
    const [, setTick] = useState(0);

    useEffect(() => {
        // 每秒触发一次内部状态更新
        const timer = setInterval(() => {
            setTick((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-fit h-fit py-0.75 px-2 bg-theme-2/20 rounded-sm text-gray-7">
            {anchorTime ? formatShowTime(new Date(anchorTime).toISOString()) : "UNDEFINED"} 更新
        </div>
    );
}

function MaxRiskGauge({ value }: { value: number }) {
    return (
        <GaugeChart
            value={value}
            subArcProp={[
                {
                    limit: 20,
                    color: "var(--color-positive)",
                    showTick: true,
                    tooltip: { text: "Safe" }
                },
                {
                    limit: 40,
                    color: "var(--color-accent-light)",
                    showTick: true,
                    tooltip: { text: "High" }
                },
                {
                    color: "var(--color-attention)",
                    tooltip: { text: "Warning" }
                }
            ]}
            extraTicks={[{ value: 60 }, { value: 80 }]}
            title="最大预测风险"
        ></GaugeChart >
    )
}

function DataQualityGauge({ value }: { value: number }) {
    return (
        <GaugeChart
            value={value}
            subArcProp={[
                {
                    limit: 60,
                    color: "var(--color-negative)",
                    showTick: true,
                    tooltip: { text: "Safe" }
                },
                {
                    limit: 80,
                    color: "var(--color-attention)",
                    showTick: true,
                    tooltip: { text: "Safe" }
                },
                {
                    limit: 90,
                    color: "var(--color-accent-light)",
                    showTick: true,
                    tooltip: { text: "High" }
                },
                {
                    color: "var(--color-positive)",
                    tooltip: { text: "Warning" }
                }
            ]}
            extraTicks={[{ value: 20 }, { value: 40 }]}
            title="输入数据质量"
        />
    )
}

function GaugeChart({ value, subArcProp, extraTicks, title }: { value: number, subArcProp: any, extraTicks: any, title: string }) {
    return (
        <div className="w-full h-full grid">
            <GaugeComponent
                value={value}
                type="grafana"
                minValue={0}
                maxValue={100}
                arc={{
                    width: 0.2,
                    padding: 0.035,
                    subArcs: [
                        {
                            limit: -1,
                            color: "var(--color-gray-7)",
                            showTick: true,
                            tooltip: { text: "No Data" }
                        },
                        ...subArcProp,
                    ],
                    subArcsStrokeWidth: 0,
                    gradient: false,
                    padEndpoints: false,
                    cornerRadius: 2,
                    emptyColor: "var(--color-gray-4)",
                    outerArc: { cornerRadius: 2, width: 1.2, padding: 0.02 }
                }}
                pointer={{
                    type: "arrow",
                    color: "var(--color-theme-6)",
                    width: 14,
                    length: 0.14,
                    arrowOffset: 0.78,
                }}
                labels={{
                    valueLabel: {
                        formatTextValue: e => {
                            const num = Number(e)
                            if (num < 0 || isNaN(num)) {
                                return "暂无"
                            }
                            return `${num.toFixed(1)}`
                        },
                        matchColorWithArc: true,
                        style: {
                            fontWeight: 600,
                            fontSize: "48px",
                            paintOrder: "normal",
                            stroke: "none",
                            textShadow: "none"
                        },
                        offsetY: -10
                    },
                    tickLabels: {
                        type: "outer",
                        ticks: extraTicks,
                        defaultTickValueConfig: {
                            formatTextValue: e => e,
                            style: { fontSize: "16px", fill: "var(--color-gray-7)" },
                            hide: false
                        },
                        defaultTickLineConfig: { distanceFromText: 9, hide: true },
                        hideMinMax: false,
                        autoSpaceTickLabels: false
                    }
                }}
                startAngle={-110}
                endAngle={110}
            />
            <div className="text-center -mt-1">{title}</div>
        </div>
    )
}

// Mock 数据生成函数，生成左侧历史数据和右侧预测数据
const generateChartData = () => {
    const data = []
    for (let x = -12; x <= 24; x++) {
        if (x < 0) {
            const val = Math.round(65 + Math.sin(x / 2) * 8 + (x + 12) * 0.5)
            data.push({ x, leftValue: val })
        } else if (x === 0) {
            const val = 72
            // 0 点作为衔接点，两边都包含
            data.push({ x, leftValue: val, rightValue: val, errorBand: [val, val] as [number, number] })
        } else {
            const baseVal = 72 + x * 0.1 + Math.sin(x / 4) * 10
            const lowerBound = baseVal - (2 + x * 0.3)
            const upperBound = baseVal + (3 + x * 0.5)
            data.push({
                x,
                rightValue: baseVal,
                errorBand: [lowerBound, upperBound] as [number, number],
            })
        }
    }
    return data
}

const chartConfig = {
} satisfies ChartConfig

export function CompDataChart() {
    const fullData = useMemo(() => generateChartData(), [])

    useSensorData((state) => state.getDataByAttrKey("rto_out_conc"))?.history

    // 拆分为各自连续无 null 的子数组，保障 type="monotone" 平滑插值生效
    const leftData = useMemo(
        () => fullData.filter((d) => d.x <= 0),
        [fullData]
    )
    const rightData = useMemo(
        () => fullData.filter((d) => d.x >= 0),
        [fullData]
    )

    const formatXAxisTick = (x: number) => {
        if (x === 0) return "0"
        const hours = x / 4
        return hours > 0 ? `+${hours}h` : `${hours}h`
    }

    const xAxisTicks = Array.from({ length: 10 }, (_, i) => -12 + i * 4)
    return (
        <div className="h-full w-full">
            <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <AreaChart
                    data={fullData}
                    margin={{ top: 10, right: 5, left: 0, bottom: 0 }}
                >
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
                    <defs>
                        <linearGradient id="warningToNegativeGrad" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="var(--color-attention)" />
                            <stop offset="100%" stopColor="var(--color-negative)" />
                        </linearGradient>
                    </defs>
                    <ReferenceArea
                        y1={80}
                        y2={120}
                        fill="url(#warningToNegativeGrad)"
                        fillOpacity={0.08}
                        stroke="none"
                        ifOverflow="hidden"
                    />
                    {/* 阶段 2：Y >= 160 纯色区 */}
                    <ReferenceArea
                        y1={120}
                        y2={10000} // 足够大即可
                        fill="var(--color-negative)"
                        fillOpacity={0.08}
                        stroke="none"
                        ifOverflow="hidden"
                    />

                    {/* X 轴配置：数值型轴，实现非对称 1:2 比例分割 */}
                    <XAxis
                        dataKey="x"
                        height={20}
                        type="number"
                        domain={[-12, 24]}
                        ticks={xAxisTicks}
                        tickFormatter={formatXAxisTick}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                    />

                    {/* Y 轴配置：自适应数值范围 */}
                    <YAxis
                        type="number"
                        width={35}
                        domain={["auto", "auto"]}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                    />

                    {/* Tooltip 悬浮框 */}
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, payload) => {
                                    const rawTime = payload?.[0]?.payload?.x
                                    if (rawTime !== undefined) {
                                        return `时间节点: ${formatXAxisTick(Number(rawTime))}`
                                    }
                                }}
                                formatter={(value) => {
                                    const formatNum = (v: string | number) => {
                                        const num = Number(v)
                                        return isNaN(num)
                                            ? v
                                            : num.toFixed(2)
                                    }

                                    // 1. 如果是数组（例如区间 [10.123, 20.456]）
                                    if (Array.isArray(value)) {
                                        return value.map(formatNum).join(" ~ ") // 输出类似: "10.12 - 20.46"
                                    }
                                    const num = Number(value)
                                    return formatNum(num)
                                }}
                            />
                        }
                    />
                    <defs>
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
                    {/* 2. 【中间层】左侧面积图 */}
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
                    />
                    {/* 3. 【顶层】右侧核心曲线 */}
                    <Area
                        type="natural"
                        data={rightData}
                        dataKey="rightValue"
                        name="预测值"
                        stroke="var(--color-accent-purple)"
                        fill="none" // 只有线，没有普通填充，阴影留给误差区域
                        strokeWidth={2}
                        connectNulls={false}
                    />
                    {/* 1. 【底图层】右侧误差区域（数据格式为 [yMin, yMax]，Recharts 自动填充中间面积） */}
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

                    <ReferenceLine
                        x={0}
                        stroke="var(--color-accent-light)"
                        strokeOpacity={0.5}
                        strokeWidth={2}
                    />
                    {/* 4. Y=80 参考线（若 Y=80 不在 Y 轴 domain 内，ifOverflow="discard" 会自动隐藏） */}
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
