import { useShallow } from 'zustand/shallow';
import { ModelPartEnum } from '../stores/ModelViewState';
import { useSensorData, AttrKeyEnum, type AttrDataHistory } from '../stores/SensorData';

interface DataBoardProps {
    title: string;
    linkedData: DataItemProps[];
}

interface DataItemProps {
    attrKey: string;
    showName: string;
    showUnit: string;
}

const BOARD_PROP_MAP: Record<ModelPartEnum, DataBoardProps> = {
    [ModelPartEnum.Ambient]: {
        title: "环境数据",
        linkedData: [
            { attrKey: AttrKeyEnum.AmbientHumidity, showName: "环境湿度", showUnit: "%" },
            { attrKey: AttrKeyEnum.AmbientPressure, showName: "大气压力", showUnit: "Pa" },
            { attrKey: AttrKeyEnum.AmbientTemp, showName: "环境温度", showUnit: "℃" },
        ]
    },
    [ModelPartEnum.Inlet]: {
        title: "废气入口数据",
        linkedData: [
            { attrKey: AttrKeyEnum.CoatingConc, showName: "进气浓度", showUnit: "mg/m³" },
            { attrKey: AttrKeyEnum.CoatingFlow, showName: "进气湿度", showUnit: "%" },
            { attrKey: AttrKeyEnum.CoatingPressure, showName: "涂布气压", showUnit: "Pa" },
            { attrKey: AttrKeyEnum.CoatingTemp, showName: "进气温度", showUnit: "℃" },
        ]
    },
    [ModelPartEnum.Rotor]: {
        title: "转轮系统",
        linkedData: [
            { attrKey: AttrKeyEnum.RotorInletTemp, showName: "入口温度", showUnit: "℃" },
            { attrKey: AttrKeyEnum.RotorInletHumid, showName: "入口湿度", showUnit: "%" },
            { attrKey: AttrKeyEnum.RotorSpeed, showName: "转轮转速", showUnit: "rpm" },
        ]
    },
    [ModelPartEnum.AdsorptionFan]: {
        title: "吸附风机",
        linkedData: [
            { attrKey: AttrKeyEnum.AdsorptionFanPower, showName: "风机功率", showUnit: "kW" },
        ]
    },
    [ModelPartEnum.DesorptionFan]: {
        title: "解吸风机",
        linkedData: [
            { attrKey: AttrKeyEnum.DesorptionTemp, showName: "解吸温度", showUnit: "℃" },
            { attrKey: AttrKeyEnum.DesorptionFanPower, showName: "风机功率", showUnit: "kW" },
        ]
    },
    [ModelPartEnum.Concentrated]: {
        title: "浓缩气体通路",
        linkedData: [
            { attrKey: AttrKeyEnum.ConcentratedTemp, showName: "浓缩气温", showUnit: "℃" },
            { attrKey: AttrKeyEnum.ConcentratedFlow, showName: "浓缩气流", showUnit: "m³/h" },
            { attrKey: AttrKeyEnum.ConcentratedPressure, showName: "浓缩气压", showUnit: "Pa" },
            { attrKey: AttrKeyEnum.ConcentratedConc, showName: "浓缩浓度", showUnit: "mg/m³" },
        ]
    },
    [ModelPartEnum.CombustionChamber]: {
        title: "RTO焚烧炉系统",
        linkedData: [
            { attrKey: AttrKeyEnum.RTOInFlow, showName: "进气流量", showUnit: "m³/h" },
            { attrKey: AttrKeyEnum.RTOInPressure, showName: "进气压力", showUnit: "Pa" },
            { attrKey: AttrKeyEnum.RTOInTemp, showName: "进气温度", showUnit: "℃" },
            { attrKey: AttrKeyEnum.RTOInConc, showName: "进气浓度", showUnit: "mg/m³" },
            { attrKey: AttrKeyEnum.CombustionTemp, showName: "焚烧炉温", showUnit: "℃" },
        ]
    },
    [ModelPartEnum.Outlet]: {
        title: "气体排放口",
        linkedData: [
            { attrKey: AttrKeyEnum.RTOOutTemp, showName: "排气温度", showUnit: "℃" },
            { attrKey: AttrKeyEnum.RTOOutConc, showName: "排气浓度", showUnit: "mg/m³" },
        ]
    }
}

export function FloatingDataBoard({ data }: { data: ModelPartEnum }) {
    const { title } = BOARD_PROP_MAP[data] ?? { title: "UNKNOWN" };
    const linkedData = BOARD_PROP_MAP[data]?.linkedData ?? [];

    return (
        // 外层容器：相对定位，预留底部箭头的空间
        <div className="relative inline-block w-fit">
            <div className="flex flex-col p-2 px-3 min-w-100 \
            rounded-sm backdrop-blur-xs shadow-xl bg-theme-1/60">

                {/* 标题 */}
                <div className="text-lg text-text font-bold pb-2">{title}</div>

                <div className="flex gap-1.5 px-1 pb-2">
                    {linkedData.map((item) => (
                        <DataItem key={item.attrKey} {...item} />
                    ))}
                </div>
                <DataHistoryChart />
            </div>

            {/* 底部指示箭头 */}
            <div
                className="absolute -bottom-3 left-1/2 bg-theme-1/60 -translate-x-1/2 w-7 h-3 z-[-1]"
                style={{
                    // 定义三角形：(50% 100%) 是下方的尖，(0% 0%) 和 (100% 0%) 是上方两个角
                    clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)'
                }}
                aria-hidden="true"
            />
        </div>
    );
}

function DataItem({ attrKey, showName, showUnit }: DataItemProps) {

    const value = useSensorData((state) => state.getDataByAttrKey(attrKey))?.latestValue;
    const updated = useSensorData((state) => state.getDataByAttrKey(attrKey))?.lastUpdated;

    return (
        <div key={updated} className="w-22 p-1 animate-flash-highlight flex flex-1 flex-col \
        rounded-sm items-center justify-between">
            <span className="text-sm text-text pr-1">{showName}</span>
            <div className="flex items-baseline gap-0.5">
                <div className="text-xl font-semibold text-text leading-none">
                    {FormatValue(3, value?.value ?? -1)}
                </div>
                <span className="text-xs text-text">{showUnit}</span>
            </div>
        </div>
    )
}

function FormatValue(precision: number, value: number): string {
    const absVal = Math.abs(value);
    const isK = absVal >= 1000;
    // 进行千位缩放处理
    const scaled = isK ? value / 1000 : value;
    const unit = isK ? 'k' : '';
    // 计算缩放后数值的整数部分位数
    const intDigits = Math.floor(Math.abs(scaled)).toString().length;
    // 计算需要保留的小数位数（有效位数 - 整数位数，最小为 0）
    const decimalPlaces = Math.max(0, precision - intDigits);
    return scaled.toFixed(decimalPlaces) + unit;
}

import {
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    ReferenceLine,
    matchByDataKey,
} from "recharts"
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useMemo } from "react"

const chartConfig = {
    value: {
        label: "历史值",
        color: "var(--color-accent)",
    },
} satisfies ChartConfig

export function DataHistoryChart() {
    // Zustand 接入示例（替换 selector 逻辑）
    const attrDataHistory = useSensorData((state) => state.getDataByAttrKey(AttrKeyEnum.RTOInFlow)) as AttrDataHistory | undefined
    // 转换数据：将 timestamp 映射为相对小时数偏移量，并保留左右两侧少许缓冲点 (Offscreen Buffer)
    const chartData = useMemo(() => {
        const history = attrDataHistory?.history ?? []
        if (history.length === 0) return []

        const nowMs = Date.now()
        // 增加 0.5h 的缓冲，避免边界切线断裂，搭配 allowDataOverflow 进行裁剪
        const bufferHours = 0.5

        return history
            .map((pt) => {
                const timeMs = new Date(pt.timestamp).getTime()
                const offsetHours = (timeMs - nowMs) / (1000 * 30) //(1000 * 60 * 60)
                return {
                    x: offsetHours,
                    value: pt.value,
                    rawTimestamp: pt.timestamp, // 关键：用作动画匹配的唯一 Key
                }
            })
            // 筛选范围包含缓冲区 [-6.5, 0.5]
            .filter((item) => item.x >= -6 - bufferHours && item.x <= 0 + bufferHours)
            .sort((a, b) => a.x - b.x)
    }, [attrDataHistory])

    // 规定显示的 7 个固定刻度：-6h ... 0(当前)
    const xAxisTicks = [-6, -5, -4, -3, -2, -1, 0]

    const formatXAxisTick = (val: number) => {
        if (val === 0) return "当前"
        return `${val}h`
    }

    return (
        <div className="h-30 w-full">
            <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="5%"
                                stopColor="var(--color-accent)"
                                stopOpacity={0.4}
                            />
                            <stop
                                offset="95%"
                                stopColor="var(--color-accent)"
                                stopOpacity={0.05}
                            />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        vertical={false}
                        strokeDasharray="4"
                        strokeOpacity={0.4}
                    />

                    {/* X 轴：加上 allowDataOverflow，超出的缓冲区数据点会被 clipPath 自动裁剪 */}
                    <XAxis
                        dataKey="x"
                        type="number"
                        domain={[-6, 0]}
                        allowDataOverflow={true}
                        ticks={xAxisTicks}
                        tickFormatter={formatXAxisTick}
                        height={20}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                    />

                    {/* Y 轴：随数值自适应 */}
                    <YAxis
                        type="number"
                        width={35}
                        domain={["auto", "auto"]}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                    />

                    {/* Tooltip 悬浮提示框 */}
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, payload) => {
                                    const item = payload?.[0]?.payload
                                    if (!item) return ""
                                    const timeStr = new Date(item.rawTimestamp).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                    })
                                    return `偏移: ${formatXAxisTick(Number(item.x.toFixed(1)))} (${timeStr})`
                                }}
                                formatter={(value) => {
                                    const num = Number(value)
                                    return isNaN(num) ? value : num.toFixed(2)
                                }}
                            />
                        }
                    />

                    {/* 
                      animationMatchBy={matchByDataKey("rawTimestamp")}:
                      直接使用 Recharts 官方导出的 matchByDataKey 辅助函数匹配 payload 中的原始 timestamp
                    */}
                    <Area
                        type="monotone"
                        dataKey="value"
                        name="历史值"
                        stroke="var(--color-accent)"
                        fill="url(#historyGradient)"
                        strokeWidth={2}
                        connectNulls
                        animationMatchBy={matchByDataKey("rawTimestamp")}
                        animationDuration={1000}
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    )
}