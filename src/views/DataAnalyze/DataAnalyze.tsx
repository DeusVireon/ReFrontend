import { useEffect } from 'react'
import { RefreshCw, Highlighter, Eraser } from 'lucide-react'
import { AnalyzeSection } from './components/AnalyzeSection'
import { DataTable } from './components/DataTable'
import { FieldSelector, SelectedSummary } from './components/FieldSelector'
import { TrendChart } from './components/TrendChart'
import { loadAnalyzeSnapshot, useAnalyzeData } from './stores/AnalyzeData'

export function DataAnalyze() {
    const status = useAnalyzeData((s) => s.status)
    const error = useAnalyzeData((s) => s.error)
    const updatedAt = useAnalyzeData((s) => s.updatedAt)
    const windowLabel = useAnalyzeData((s) => s.windowLabel)
    const highlight = useAnalyzeData((s) => s.highlight)
    const series = useAnalyzeData((s) => s.series)
    const setHighlight = useAnalyzeData((s) => s.setHighlight)
    const clearHighlight = useAnalyzeData((s) => s.clearHighlight)

    useEffect(() => {
        void loadAnalyzeSnapshot()
    }, [])

    const applyDemoHighlight = () => {
        if (series.length < 10) return
        // 演示预留高亮接口：后续可由路由 query / 告警跳转写入
        const start = series[30]?.timestamp ?? series[Math.floor(series.length * 0.6)]!.timestamp
        const end = series[34]?.timestamp ?? series[Math.floor(series.length * 0.7)]!.timestamp
        setHighlight({
            start,
            end,
            attrKeys: null,
            source: 'demo',
        })
    }

    return (
        <div className="min-h-screen w-full overflow-y-auto bg-theme-5 text-text">
            {/* 顶部预留：后续可共用 Dashboard HeaderBar */}
            <div className="h-16 shrink-0" aria-hidden />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 pb-10">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-bold tracking-wide">数据分析</h1>
                        <p className="mt-1 text-sm text-gray-7">
                            {windowLabel || '加载完整历史快照以进行多字段对照'}
                            {updatedAt
                                ? ` · 更新于 ${new Date(updatedAt).toLocaleString('zh-CN', { hour12: false })}`
                                : null}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={applyDemoHighlight}
                            disabled={status !== 'ready'}
                            className="flex items-center gap-1 rounded-xs border border-theme-1/40 bg-theme-2/60 px-2.5 py-1 text-sm hover:bg-theme-2 disabled:opacity-40"
                        >
                            <Highlighter className="size-4" strokeWidth={2.25} />
                            演示高亮区段
                        </button>
                        <button
                            type="button"
                            onClick={clearHighlight}
                            disabled={!highlight.start}
                            className="flex items-center gap-1 rounded-xs border border-theme-1/40 bg-theme-2/60 px-2.5 py-1 text-sm hover:bg-theme-2 disabled:opacity-40"
                        >
                            <Eraser className="size-4" strokeWidth={2.25} />
                            清除高亮
                        </button>
                        <button
                            type="button"
                            onClick={() => void loadAnalyzeSnapshot()}
                            disabled={status === 'loading'}
                            className="flex items-center gap-1 rounded-xs border border-accent/40 bg-accent/20 px-2.5 py-1 text-sm hover:bg-accent/30 disabled:opacity-40"
                        >
                            <RefreshCw className="size-4" strokeWidth={2.25} />
                            重新拉取
                        </button>
                    </div>
                </header>

                {status === 'loading' || status === 'idle' ? (
                    <ColdStartPanel />
                ) : null}

                {status === 'error' ? (
                    <ErrorPanel message={error} onRetry={() => void loadAnalyzeSnapshot()} />
                ) : null}

                {status === 'ready' ? (
                    <>
                        <AnalyzeSection
                            title="字段选择"
                            description="按工艺段分组；选中字段同步驱动图表与表格。预留路由高亮时可自动勾选对应字段。"
                        >
                            <FieldSelector />
                        </AnalyzeSection>

                        <AnalyzeSection title="关键指标" description="当前选中字段的最新值与窗口统计">
                            <SelectedSummary />
                        </AnalyzeSection>

                        <AnalyzeSection
                            title="趋势对照"
                            description={
                                highlight.start
                                    ? `高亮区段已激活${highlight.source ? `（来源: ${highlight.source}）` : ''}`
                                    : '支持多字段叠加；高亮区段接口已预留，供告警跳转写入'
                            }
                        >
                            <TrendChart />
                        </AnalyzeSection>

                        <AnalyzeSection
                            title="数据明细"
                            description="展示窗口内最近 24 个采样点（新→旧）；命中高亮区段的行会闪烁提示"
                        >
                            <DataTable />
                        </AnalyzeSection>
                    </>
                ) : null}
            </div>
        </div>
    )
}

function ColdStartPanel() {
    return (
        <div className="animate-expand-right rounded-md border border-theme-1/25 bg-theme-2/40 px-4 py-8 text-center text-gray-7">
            <div className="mx-auto mb-3 h-1 w-40 overflow-hidden rounded-full bg-theme-1/40">
                <div className="h-full w-1/2 animate-flash-highlight bg-accent" />
            </div>
            正在拉取完整分析快照…
        </div>
    )
}

function ErrorPanel({ message, onRetry }: { message: string | null; onRetry: () => void }) {
    return (
        <div className="rounded-md border border-negative/40 bg-negative-dark/20 px-4 py-6 text-center">
            <p className="font-semibold text-negative">冷启动失败，未能获取分析数据</p>
            <p className="mt-1 text-sm text-gray-7">{message ?? '未知错误'}</p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-xs border border-theme-1/40 bg-theme-2/60 px-3 py-1 text-sm hover:bg-theme-2"
            >
                重试
            </button>
        </div>
    )
}
