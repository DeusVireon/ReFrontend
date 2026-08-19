import { useEffect, useState } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    Download,
    Eraser,
    Highlighter,
    Moon,
    RefreshCw,
    Search,
    Sun,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { AnalyzeAlertOverlay } from './components/AnalyzeAlertOverlay'
import { AnalyzeSection } from './components/AnalyzeSection'
import { DataTable } from './components/DataTable'
import { FieldSelector, SelectedSummary } from './components/FieldSelector'
import { TrendChart } from './components/TrendChart'
import { downloadAnalyzeCsv } from './services/historyAdapter'
import { loadAnalyzeSnapshot, useAnalyzeData } from './stores/AnalyzeData'
import './data-analyze.css'

function toDateTimeLocalValue(date: Date) {
    const offset = date.getTimezoneOffset() * 60_000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function DataAnalyze() {
    const { theme, toggleTheme, isTransitioning } = useTheme()
    const status = useAnalyzeData((state) => state.status)
    const error = useAnalyzeData((state) => state.error)
    const updatedAt = useAnalyzeData((state) => state.updatedAt)
    const windowLabel = useAnalyzeData((state) => state.windowLabel)
    const highlight = useAnalyzeData((state) => state.highlight)
    const series = useAnalyzeData((state) => state.series)
    const selectedKeys = useAnalyzeData((state) => state.selectedKeys)
    const query = useAnalyzeData((state) => state.query)
    const pagination = useAnalyzeData((state) => state.pagination)
    const setHighlight = useAnalyzeData((state) => state.setHighlight)
    const clearHighlight = useAnalyzeData((state) => state.clearHighlight)
    const [startInput, setStartInput] = useState(() =>
        toDateTimeLocalValue(new Date(Date.now() - 24 * 60 * 60_000)),
    )
    const [endInput, setEndInput] = useState(() => toDateTimeLocalValue(new Date()))

    useEffect(() => {
        void loadAnalyzeSnapshot()
    }, [])

    const loadPage = (page = 1) => {
        const start = new Date(startInput)
        const end = new Date(endInput)
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return
        void loadAnalyzeSnapshot({
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            fields: selectedKeys,
            page,
        })
    }

    const applyDemoHighlight = () => {
        if (series.length < 3) return
        const startIndex = Math.max(0, Math.floor(series.length * 0.62))
        const endIndex = Math.min(series.length - 1, startIndex + Math.max(2, Math.floor(series.length * 0.08)))
        setHighlight({
            start: series[startIndex]?.timestamp ?? null,
            end: series[endIndex]?.timestamp ?? null,
            attrKeys: selectedKeys,
            source: 'manual-demo',
        })
    }

    return (
        <div className="app-viewport-background min-h-screen w-full overflow-y-auto text-text">
            <AnalyzeAlertOverlay />
            <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-6 pb-10 pt-6">
                <header className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-theme-1/25 bg-theme-2/35 p-5 shadow-[var(--glass-shadow)] backdrop-blur-xl">
                    <div>
                        <div className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent-light">DATA ANALYSIS</div>
                        <h1 className="text-3xl font-bold tracking-wide">历史数据分析</h1>
                        <p className="mt-1 text-sm text-gray-7">
                            {windowLabel || '多字段历史趋势、异常区间与告警联动'}
                            {updatedAt ? ` · 更新于 ${new Date(updatedAt).toLocaleString('zh-CN', { hour12: false })}` : ''}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            disabled={isTransitioning}
                            className="analysis-button"
                            aria-label={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
                        >
                            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                            {theme === 'dark' ? '亮色' : '暗色'}
                        </button>
                        <button type="button" onClick={applyDemoHighlight} disabled={status !== 'ready'} className="analysis-button">
                            <Highlighter className="size-4" />
                            演示高亮
                        </button>
                        <button type="button" onClick={clearHighlight} disabled={!highlight.start} className="analysis-button">
                            <Eraser className="size-4" />
                            清除高亮
                        </button>
                        <button
                            type="button"
                            onClick={() => downloadAnalyzeCsv(series, selectedKeys)}
                            disabled={status !== 'ready'}
                            className="analysis-button analysis-button--primary"
                        >
                            <Download className="size-4" />
                            导出 CSV
                        </button>
                    </div>
                </header>

                <AnalyzeSection title="查询条件" description="按时间窗口查询完整历史快照，字段按钮控制图表与明细的可见内容">
                    <div className="flex flex-wrap items-end gap-3">
                        <label className="grid min-w-[220px] gap-1 text-sm text-gray-7">
                            开始时间
                            <input
                                type="datetime-local"
                                value={startInput}
                                onChange={(event) => setStartInput(event.target.value)}
                                className="analysis-input"
                            />
                        </label>
                        <label className="grid min-w-[220px] gap-1 text-sm text-gray-7">
                            结束时间
                            <input
                                type="datetime-local"
                                value={endInput}
                                onChange={(event) => setEndInput(event.target.value)}
                                className="analysis-input"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => loadPage(1)}
                            disabled={status === 'loading'}
                            className="analysis-button analysis-button--primary h-10"
                        >
                            {status === 'loading' ? <RefreshCw className="size-4 animate-spin" /> : <Search className="size-4" />}
                            查询
                        </button>
                    </div>
                </AnalyzeSection>

                {status === 'loading' || status === 'idle' ? <ColdStartPanel /> : null}
                {status === 'error' ? <ErrorPanel message={error} onRetry={() => loadPage(query.page)} /> : null}

                {status === 'ready' ? (
                    <>
                        <AnalyzeSection title="字段选择" description="按工艺段选择；新增字段会立即绘制并播放进入动画">
                            <FieldSelector />
                        </AnalyzeSection>
                        <AnalyzeSection title="关键指标" description="当前页所选字段的最新值、均值与峰值">
                            <SelectedSummary />
                        </AnalyzeSection>
                        <AnalyzeSection
                            title="趋势曲线"
                            description={
                                highlight.start
                                    ? `高亮区段已激活${highlight.source ? `（${highlight.source}）` : ''}`
                                    : 'Area 曲线支持底部 Brush 缩放；温度字段使用右侧坐标轴'
                            }
                        >
                            <TrendChart />
                        </AnalyzeSection>
                        <AnalyzeSection
                            title="数据明细"
                            description={`共 ${pagination.total} 条 · 第 ${pagination.page}/${pagination.totalPages} 页`}
                        >
                            <DataTable />
                            <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    disabled={pagination.page <= 1}
                                    onClick={() => loadPage(pagination.page - 1)}
                                    className="analysis-button"
                                >
                                    <ChevronLeft className="size-4" />
                                    上一页
                                </button>
                                <span className="rounded-lg border border-theme-1/25 bg-theme-1/20 px-3 py-1.5 text-sm text-gray-7">
                                    {pagination.page} / {pagination.totalPages}
                                </span>
                                <button
                                    type="button"
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => loadPage(pagination.page + 1)}
                                    className="analysis-button"
                                >
                                    下一页
                                    <ChevronRight className="size-4" />
                                </button>
                            </div>
                        </AnalyzeSection>
                    </>
                ) : null}
            </div>
        </div>
    )
}

function ColdStartPanel() {
    return (
        <div className="animate-expand-right rounded-xl border border-theme-1/25 bg-theme-2/40 px-4 py-10 text-center text-gray-7">
            <div className="mx-auto mb-3 h-1 w-40 overflow-hidden rounded-full bg-theme-1/40">
                <div className="h-full w-1/2 animate-pulse bg-accent" />
            </div>
            正在拉取历史分析数据…
        </div>
    )
}

function ErrorPanel({ message, onRetry }: { message: string | null; onRetry: () => void }) {
    return (
        <div className="rounded-xl border border-negative/40 bg-negative-dark/20 px-4 py-8 text-center">
            <p className="font-semibold text-negative">未能获取历史分析数据</p>
            <p className="mt-1 text-sm text-gray-7">{message ?? '未知错误'}</p>
            <button type="button" onClick={onRetry} className="analysis-button mt-4">
                <RefreshCw className="size-4" />
                重试
            </button>
        </div>
    )
}
