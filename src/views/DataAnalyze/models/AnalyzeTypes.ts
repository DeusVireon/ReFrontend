/** 数据分析页共用类型与字段元数据 */

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface TimeSeriesPoint {
    timestamp: string
    values: Record<string, number>
}

export interface FieldMeta {
    key: string
    label: string
    unit: string
    group: string
}

export interface FieldGroup {
    id: string
    label: string
    keys: string[]
}

export interface SeriesStat {
    key: string
    latest: number
    min: number
    max: number
    avg: number
}

export interface AnalyzePayload {
    updatedAt: string
    windowLabel: string
    series: TimeSeriesPoint[]
    stats: SeriesStat[]
}

/** 预留接口：外部接口跳转可在此写入高亮的区段 */
export interface HighlightRange {
    start: string | null
    end: string | null
    /** 可选：仅高亮指定字段 */
    attrKeys: string[] | null
    /** 来源说明，便于调试与后续联动 */
    source?: string
}

export const FIELD_META: FieldMeta[] = [
    { key: 'ambient_temp', label: '环境温度', unit: '°C', group: 'ambient' },
    { key: 'ambient_humidity', label: '环境湿度', unit: '%', group: 'ambient' },
    { key: 'ambient_pressure', label: '环境气压', unit: 'kPa', group: 'ambient' },
    { key: 'coating_flow', label: '涂布流量', unit: 'm³/h', group: 'coating' },
    { key: 'coating_conc', label: '涂布浓度', unit: 'mg/m³', group: 'coating' },
    { key: 'coating_temp', label: '涂布温度', unit: '°C', group: 'coating' },
    { key: 'coating_pressure', label: '涂布气压', unit: 'kPa', group: 'coating' },
    { key: 'rotor_speed', label: '转轮转速', unit: 'r/min', group: 'rotor' },
    { key: 'adsorption_fan_power', label: '吸附风机功率', unit: '%', group: 'rotor' },
    { key: 'desorption_fan_power', label: '脱附风机功率', unit: '%', group: 'rotor' },
    { key: 'rotor_inlet_temp', label: '转轮入口温度', unit: '°C', group: 'rotor' },
    { key: 'rotor_inlet_humid', label: '转轮入口湿度', unit: '%', group: 'rotor' },
    { key: 'desorption_temp', label: '脱附温度', unit: '°C', group: 'rotor' },
    { key: 'concentrated_flow', label: '浓缩风流量', unit: 'm³/h', group: 'concentrated' },
    { key: 'concentrated_conc', label: '浓缩风浓度', unit: 'mg/m³', group: 'concentrated' },
    { key: 'concentrated_temp', label: '浓缩风温度', unit: '°C', group: 'concentrated' },
    { key: 'concentrated_pressure', label: '浓缩风气压', unit: 'kPa', group: 'concentrated' },
    { key: 'rto_in_flow', label: 'RTO 进气流量', unit: 'm³/h', group: 'rto_in' },
    { key: 'rto_in_conc', label: 'RTO 进气浓度', unit: 'mg/m³', group: 'rto_in' },
    { key: 'rto_in_temp', label: 'RTO 进气温度', unit: '°C', group: 'rto_in' },
    { key: 'rto_in_pressure', label: 'RTO 进气气压', unit: 'kPa', group: 'rto_in' },
    { key: 'burner_gas_flow', label: '燃烧器燃气流量', unit: 'm³/h', group: 'rto_out' },
    { key: 'combustion_temp', label: '燃烧温度', unit: '°C', group: 'rto_out' },
    { key: 'rto_out_conc', label: 'RTO 出口浓度', unit: 'mg/m³', group: 'rto_out' },
    { key: 'rto_out_temp', label: 'RTO 出口温度', unit: '°C', group: 'rto_out' },
]

export const FIELD_GROUPS: FieldGroup[] = [
    { id: 'ambient', label: '环境', keys: FIELD_META.filter((f) => f.group === 'ambient').map((f) => f.key) },
    { id: 'coating', label: '涂布', keys: FIELD_META.filter((f) => f.group === 'coating').map((f) => f.key) },
    { id: 'rotor', label: '转轮', keys: FIELD_META.filter((f) => f.group === 'rotor').map((f) => f.key) },
    { id: 'concentrated', label: '浓缩风', keys: FIELD_META.filter((f) => f.group === 'concentrated').map((f) => f.key) },
    { id: 'rto_in', label: 'RTO 进气', keys: FIELD_META.filter((f) => f.group === 'rto_in').map((f) => f.key) },
    { id: 'rto_out', label: 'RTO 燃烧/排放', keys: FIELD_META.filter((f) => f.group === 'rto_out').map((f) => f.key) },
]

export const FIELD_META_MAP: Record<string, FieldMeta> = Object.fromEntries(
    FIELD_META.map((f) => [f.key, f])
)

/** 图表折线颜色轮询部分 */
export const SERIES_COLORS = [
    'var(--color-accent)',
    'var(--color-accent-cyan)',
    'var(--color-accent-purple)',
    'var(--color-positive)',
    'var(--color-attention)',
    'var(--color-accent-light)',
] as const

//默认打开的时候写死的mock数据
export const DEFAULT_SELECTED_KEYS = [
    'coating_conc',
    'concentrated_conc',
    'rto_out_conc',
    'combustion_temp',
]
