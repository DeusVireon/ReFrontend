import { FIELD_META_MAP } from '../models/AnalyzeTypes'
import type {
    AnalyzePayload,
    AnalyzeQuery,
    SeriesStat,
    TimeSeriesPoint,
} from '../models/AnalyzeTypes'

function calculateStats(series: TimeSeriesPoint[], fields: string[]): SeriesStat[] {
    return fields.flatMap((key) => {
        const values = series
            .map((point) => point.values[key])
            .filter((value): value is number => Number.isFinite(value))
        if (!values.length) return []
        const round = (value: number) => Number(value.toFixed(3))
        return [{
            key,
            latest: round(values[values.length - 1]!),
            min: round(Math.min(...values)),
            max: round(Math.max(...values)),
            avg: round(values.reduce((sum, value) => sum + value, 0) / values.length),
        }]
    })
}

export async function fetchAnalyzeHistory(query: AnalyzeQuery): Promise<AnalyzePayload> {
    const response = await fetch('/api/analyze')
    if (!response.ok) throw new Error(`历史数据请求失败（${response.status}）`)
    const payload = await response.json() as AnalyzePayload
    if (!Array.isArray(payload.series)) throw new Error('历史数据格式无效')

    const start = Date.parse(query.startTime)
    const end = Date.parse(query.endTime)
    const fullSeries = payload.series
        .filter((point) => {
            const time = Date.parse(point.timestamp)
            return Number.isFinite(time) && time >= start && time <= end
        })
        .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))

    const pageSize = Math.max(1, query.pageSize)
    const totalPages = Math.max(1, Math.ceil(fullSeries.length / pageSize))
    const page = Math.min(Math.max(1, query.page), totalPages)
    const offset = (page - 1) * pageSize
    const series = fullSeries.slice(offset, offset + pageSize)
    const fields = Object.keys(FIELD_META_MAP)

    return {
        updatedAt: payload.updatedAt ?? new Date().toISOString(),
        windowLabel: `${new Date(query.startTime).toLocaleString('zh-CN', { hour12: false })} — ${new Date(query.endTime).toLocaleString('zh-CN', { hour12: false })}`,
        series,
        stats: calculateStats(series, fields),
        pagination: {
            total: fullSeries.length,
            page,
            pageSize,
            totalPages,
        },
    }
}

export function downloadAnalyzeCsv(series: TimeSeriesPoint[], fields: string[]) {
    const validFields = fields.filter((key) => Boolean(FIELD_META_MAP[key]))
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
    const rows = [
        ['timestamp', ...validFields].map(escape).join(','),
        ...series.map((point) =>
            [point.timestamp, ...validFields.map((key) => point.values[key] ?? '')]
                .map(escape)
                .join(','),
        ),
    ]
    const blob = new Blob([`\uFEFF${rows.join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'data-analyze.csv'
    anchor.click()
    URL.revokeObjectURL(url)
}
