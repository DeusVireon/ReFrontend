import { create } from 'zustand'
import { fetchAnalyzeHistory } from '../services/historyAdapter'
import {
    DEFAULT_SELECTED_KEYS,
    type AnalyzePayload,
    type AnalyzePagination,
    type AnalyzeQuery,
    type HighlightRange,
    type LoadStatus,
    type SeriesStat,
    type TimeSeriesPoint,
} from '../models/AnalyzeTypes'

interface AnalyzeDataStore {
    status: LoadStatus
    error: string | null
    updatedAt: string | null
    windowLabel: string
    series: TimeSeriesPoint[]
    statsByKey: Record<string, SeriesStat>
    query: AnalyzeQuery
    pagination: AnalyzePagination

    /** 当前选中的字段（图表 / 表格共用） */
    selectedKeys: string[]
    /** 预留高亮接口：可由路由参数后续写入 */
    highlight: HighlightRange

    setPayload: (payload: AnalyzePayload, query: AnalyzeQuery) => void
    setStatus: (status: LoadStatus, error?: string | null) => void
    toggleKey: (key: string) => void
    setSelectedKeys: (keys: string[]) => void
    setGroupKeys: (keys: string[], enabled: boolean) => void
    setHighlight: (highlight: Partial<HighlightRange>) => void
    clearHighlight: () => void
}

const EMPTY_HIGHLIGHT: HighlightRange = {
    start: null,
    end: null,
    attrKeys: null,
    revision: 0,
}

const INITIAL_QUERY: AnalyzeQuery = {
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
    fields: [...DEFAULT_SELECTED_KEYS],
    page: 1,
    pageSize: 192,
}

const INITIAL_PAGINATION: AnalyzePagination = {
    total: 0,
    page: 1,
    pageSize: 192,
    totalPages: 1,
}

function reconcileHighlight(series: TimeSeriesPoint[], highlight: HighlightRange): HighlightRange {
    if (!highlight.start || !highlight.end) return highlight
    const samples = series
        .map((point) => ({ timestamp: point.timestamp, time: Date.parse(point.timestamp) }))
        .filter((sample) => Number.isFinite(sample.time))
    const start = Date.parse(highlight.start)
    const end = Date.parse(highlight.end)
    if (!samples.length || !Number.isFinite(start) || !Number.isFinite(end)) {
        return { ...EMPTY_HIGHLIGHT, revision: (highlight.revision ?? 0) + 1 }
    }

    const rangeStart = Math.min(start, end)
    const rangeEnd = Math.max(start, end)
    const dataStart = samples[0]!.time
    const dataEnd = samples[samples.length - 1]!.time
    if (rangeEnd < dataStart || rangeStart > dataEnd) {
        return { ...EMPTY_HIGHLIGHT, revision: (highlight.revision ?? 0) + 1 }
    }

    const nearest = (target: number) =>
        samples.reduce((best, sample) =>
            Math.abs(sample.time - target) < Math.abs(best.time - target) ? sample : best,
        )
    let first = nearest(Math.max(dataStart, rangeStart))
    let last = nearest(Math.min(dataEnd, rangeEnd))
    if (first.time > last.time) [first, last] = [last, first]
    if (first.time === last.time && samples.length > 1) {
        const index = samples.indexOf(first)
        if (index < samples.length - 1) last = samples[index + 1]!
        else first = samples[index - 1]!
    }
    return {
        ...highlight,
        start: first.timestamp,
        end: last.timestamp,
        revision: (highlight.revision ?? 0) + 1,
    }
}

export const useAnalyzeData = create<AnalyzeDataStore>((set, get) => ({
    status: 'idle',
    error: null,
    updatedAt: null,
    windowLabel: '',
    series: [],
    statsByKey: {},
    query: { ...INITIAL_QUERY, fields: [...INITIAL_QUERY.fields] },
    pagination: { ...INITIAL_PAGINATION },
    selectedKeys: [...DEFAULT_SELECTED_KEYS],
    highlight: { ...EMPTY_HIGHLIGHT },

    setPayload: (payload, query) => {
        if (!payload || !Array.isArray(payload.series)) return

        const statsByKey: Record<string, SeriesStat> = {}
        for (const stat of payload.stats ?? []) {
            if (stat?.key) statsByKey[stat.key] = stat
        }

        set({
            status: 'ready',
            error: null,
            updatedAt: payload.updatedAt ?? null,
            windowLabel: payload.windowLabel ?? '',
            series: payload.series,
            statsByKey,
            query,
            pagination: payload.pagination,
            highlight: reconcileHighlight(payload.series, get().highlight),
        })
    },

    setStatus: (status, error = null) => {
        set({ status, error })
    },

    toggleKey: (key) => {
        const { selectedKeys } = get()
        if (selectedKeys.includes(key)) {
            if (selectedKeys.length <= 1) return
            set({ selectedKeys: selectedKeys.filter((k) => k !== key) })
            return
        }
        set({ selectedKeys: [...selectedKeys, key] })
    },

    setSelectedKeys: (keys) => {
        if (!keys.length) return
        set({ selectedKeys: keys })
    },

    setGroupKeys: (keys, enabled) => {
        const { selectedKeys } = get()
        if (enabled) {
            const merged = [...selectedKeys]
            for (const key of keys) {
                if (!merged.includes(key)) merged.push(key)
            }
            set({ selectedKeys: merged })
            return
        }
        const next = selectedKeys.filter((k) => !keys.includes(k))
        set({ selectedKeys: next.length ? next : selectedKeys.slice(0, 1) })
    },

    setHighlight: (partial) => {
        set((state) => ({
            highlight: {
                ...state.highlight,
                ...partial,
                revision: (state.highlight.revision ?? 0) + 1,
            },
        }))
    },

    clearHighlight: () => {
        set({ highlight: { ...EMPTY_HIGHLIGHT } })
    },
}))

let latestRequest = 0

export async function loadAnalyzeSnapshot(overrides: Partial<AnalyzeQuery> = {}): Promise<void> {
    const store = useAnalyzeData.getState()
    const query: AnalyzeQuery = {
        ...store.query,
        ...overrides,
        fields: overrides.fields ? [...overrides.fields] : [...store.query.fields],
    }
    const start = Date.parse(query.startTime)
    const end = Date.parse(query.endTime)
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
        store.setStatus('error', '起始时间必须早于结束时间')
        return
    }

    const request = ++latestRequest
    store.setStatus('loading')

    try {
        const payload = await fetchAnalyzeHistory(query)
        if (request !== latestRequest) return
        useAnalyzeData.getState().setPayload(payload, query)
    } catch (error) {
        if (request !== latestRequest) return
        useAnalyzeData.getState().setStatus(
            'error',
            error instanceof Error ? error.message : '历史数据加载失败',
        )
    }
}
