import { create } from 'zustand'
import { RestApiInst } from '@/services/RestApi'
import {
    DEFAULT_SELECTED_KEYS,
    type AnalyzePayload,
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

    /** 当前选中的字段（图表 / 表格共用） */
    selectedKeys: string[]
    /** 预留高亮接口：可由路由参数后续写入 */
    highlight: HighlightRange

    setPayload: (payload: AnalyzePayload) => void
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
}

export const useAnalyzeData = create<AnalyzeDataStore>((set, get) => ({
    status: 'idle',
    error: null,
    updatedAt: null,
    windowLabel: '',
    series: [],
    statsByKey: {},
    selectedKeys: [...DEFAULT_SELECTED_KEYS],
    highlight: { ...EMPTY_HIGHLIGHT },

    setPayload: (payload) => {
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
            highlight: { ...state.highlight, ...partial },
        }))
    },

    clearHighlight: () => {
        set({ highlight: { ...EMPTY_HIGHLIGHT } })
    },
}))

/** 冷启动：请求完整快照，解析交给 RestApi，写入 store */
export async function loadAnalyzeSnapshot(): Promise<void> {
    const store = useAnalyzeData.getState()
    store.setStatus('loading')

    const result = await RestApiInst.get<AnalyzePayload>('/api/analyze', (payload) => {
        useAnalyzeData.getState().setPayload(payload)
    })

    if (!result.ok) {
        // 若 handler 未成功写入 ready，则标记错误（冷启动失败）
        if (useAnalyzeData.getState().status !== 'ready') {
            useAnalyzeData.getState().setStatus('error', result.error)
        }
    }
}
