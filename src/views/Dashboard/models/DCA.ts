export type DCAStatusLevel = "normal" | "attention" | "warning" | "critical"

export type DCAPredictionApplicability = "reliable" | "limited" | "unreliable"

export type DCARuleKind =
    | "limit"
    | "autocorrelation_peak"
    | "autocorrelation_shift"
    | "cross_correlation_peak"
    | "cross_correlation_shift"
    | "time_periodic"

export interface DCAStatusTag {
    id: string
    label: string
    level: DCAStatusLevel
}

export interface DCAHistoryPoint {
    offsetHours: number
    value: number
    baseline: number | null
}

export interface DCAScoreHistoryPoint {
    offsetHours: number
    score: number
}

export interface DCARuleResult {
    id: string
    name: string
    kind: DCARuleKind
    status: DCAStatusLevel
    score: number
    sensorKeys: string[]
    summary: string
    window: string
    condition: string
    currentValue: number
    referenceValue: number
    unit: string
    history: DCAHistoryPoint[]
}

export interface DCASnapshot {
    score: number
    scoreThreshold: number
    predictionApplicability: DCAPredictionApplicability
    sustainedMinutes: number
    statuses: DCAStatusTag[]
    rules: DCARuleResult[]
    scoreHistory: DCAScoreHistoryPoint[]
    updatedAt: string
}

export const DCA_RULE_KIND_LABELS: Record<DCARuleKind, string> = {
    limit: "高低限值",
    autocorrelation_peak: "自相关峰值",
    autocorrelation_shift: "自相关时滞偏移",
    cross_correlation_peak: "互相关峰值",
    cross_correlation_shift: "互相关时滞偏移",
    time_periodic: "时间周期状态",
}

export const DCA_APPLICABILITY_LABELS: Record<DCAPredictionApplicability, string> = {
    reliable: "预测适用性良好",
    limited: "预测适用性受限",
    unreliable: "建议人工复核预测",
}

export const DCA_RULE_COLORS = [
    "var(--color-accent)",
    "var(--color-accent-cyan)",
    "var(--color-accent-purple)",
    "var(--color-attention)",
    "var(--color-negative)",
] as const

const STATUS_LEVELS = new Set<DCAStatusLevel>([
    "normal",
    "attention",
    "warning",
    "critical",
])

const APPLICABILITY_LEVELS = new Set<DCAPredictionApplicability>([
    "reliable",
    "limited",
    "unreliable",
])

const RULE_KINDS = new Set<DCARuleKind>([
    "limit",
    "autocorrelation_peak",
    "autocorrelation_shift",
    "cross_correlation_peak",
    "cross_correlation_shift",
    "time_periodic",
])

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function numberOr(value: unknown, fallback: number): number {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

function stringOr(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback
}

function statusLevelOr(value: unknown, fallback: DCAStatusLevel): DCAStatusLevel {
    return typeof value === "string" && STATUS_LEVELS.has(value as DCAStatusLevel)
        ? value as DCAStatusLevel
        : fallback
}

function parseStatus(value: unknown, index: number): DCAStatusTag | null {
    if (!isRecord(value)) return null

    const label = stringOr(value.label)
    if (!label) return null

    return {
        id: stringOr(value.id, `status-${index}`),
        label,
        level: statusLevelOr(value.level, "normal"),
    }
}

function parseRuleHistory(value: unknown): DCAHistoryPoint[] {
    if (!Array.isArray(value)) return []

    return value.flatMap((point) => {
        if (!isRecord(point)) return []
        const offsetHours = Number(point.offsetHours)
        const measured = Number(point.value)
        if (!Number.isFinite(offsetHours) || !Number.isFinite(measured)) return []

        const baseline = point.baseline === null || point.baseline === undefined
            ? null
            : numberOr(point.baseline, measured)

        return [{ offsetHours, value: measured, baseline }]
    })
}

function parseRule(value: unknown, index: number): DCARuleResult | null {
    if (!isRecord(value)) return null

    const name = stringOr(value.name)
    const kind = stringOr(value.kind) as DCARuleKind
    if (!name || !RULE_KINDS.has(kind)) return null

    return {
        id: stringOr(value.id, `rule-${index}`),
        name,
        kind,
        status: statusLevelOr(value.status, "normal"),
        score: Math.max(0, numberOr(value.score, 0)),
        sensorKeys: Array.isArray(value.sensorKeys)
            ? value.sensorKeys.filter((item): item is string => typeof item === "string")
            : [],
        summary: stringOr(value.summary, "暂无规则摘要"),
        window: stringOr(value.window, "未配置"),
        condition: stringOr(value.condition, "未配置"),
        currentValue: numberOr(value.currentValue, 0),
        referenceValue: numberOr(value.referenceValue, 0),
        unit: stringOr(value.unit),
        history: parseRuleHistory(value.history),
    }
}

function parseScoreHistory(value: unknown): DCAScoreHistoryPoint[] {
    if (!Array.isArray(value)) return []

    return value.flatMap((point) => {
        if (!isRecord(point)) return []
        const offsetHours = Number(point.offsetHours)
        const score = Number(point.score)
        return Number.isFinite(offsetHours) && Number.isFinite(score)
            ? [{ offsetHours, score: Math.max(0, score) }]
            : []
    })
}

export function parseDCASnapshot(value: unknown, updatedAt: string): DCASnapshot | null {
    if (!isRecord(value)) return null

    const score = Number(value.score)
    if (!Number.isFinite(score)) return null

    const applicabilityRaw = stringOr(value.predictionApplicability)
    const predictionApplicability = APPLICABILITY_LEVELS.has(
        applicabilityRaw as DCAPredictionApplicability,
    )
        ? applicabilityRaw as DCAPredictionApplicability
        : "limited"

    return {
        score: Math.max(0, score),
        scoreThreshold: Math.max(0, numberOr(value.scoreThreshold, 60)),
        predictionApplicability,
        sustainedMinutes: Math.max(0, numberOr(value.sustainedMinutes, 0)),
        statuses: Array.isArray(value.statuses)
            ? value.statuses.flatMap((item, index) => {
                const parsed = parseStatus(item, index)
                return parsed ? [parsed] : []
            })
            : [],
        rules: Array.isArray(value.rules)
            ? value.rules.flatMap((item, index) => {
                const parsed = parseRule(item, index)
                return parsed ? [parsed] : []
            })
            : [],
        scoreHistory: parseScoreHistory(value.scoreHistory),
        updatedAt,
    }
}

export function getDcaScoreLevel(score: number, threshold: number): DCAStatusLevel {
    if (score >= Math.max(80, threshold + 20)) return "critical"
    if (score >= threshold) return "warning"
    if (score >= threshold * 0.5) return "attention"
    return "normal"
}
