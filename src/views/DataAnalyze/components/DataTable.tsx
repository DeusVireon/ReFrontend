import { cn } from '@/lib/utils'
import { useShallow } from 'zustand/react/shallow'
import { FIELD_META_MAP } from '../models/AnalyzeTypes'
import { useAnalyzeData } from '../stores/AnalyzeData'

function formatCellTime(iso: string) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
}

function isInHighlight(ts: string, start: string | null, end: string | null) {
    if (!start || !end) return false
    const t = new Date(ts).getTime()
    const a = new Date(start).getTime()
    const b = new Date(end).getTime()
    if (Number.isNaN(t) || Number.isNaN(a) || Number.isNaN(b)) return false
    return t >= Math.min(a, b) && t <= Math.max(a, b)
}

export function DataTable() {
    const { series, selectedKeys, highlight } = useAnalyzeData(useShallow((s) => ({
        series: s.series,
        selectedKeys: s.selectedKeys,
        highlight: s.highlight,
    })))

    // 表格切片展示最近若干行，避免一次渲染过多 DOM
    const rows = series.slice(-24).reverse()

    return (
        <div className="overflow-x-auto rounded-xs border border-theme-1/25">
            <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                    <tr className="bg-theme-1/40 text-left text-gray-7">
                        <th className="px-3 py-2 font-medium">时间</th>
                        {selectedKeys.map((key) => (
                            <th key={key} className="px-3 py-2 font-medium">
                                {FIELD_META_MAP[key]?.label ?? key}
                                <span className="ml-1 text-xs opacity-70">
                                    {FIELD_META_MAP[key]?.unit}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => {
                        const highlighted = isInHighlight(row.timestamp, highlight.start, highlight.end)
                        return (
                            <tr
                                key={row.timestamp}
                                className={cn(
                                    'border-t border-theme-1/20 animate-expand-right',
                                    highlighted
                                        ? 'bg-attention/15 animate-flash-highlight'
                                        : index % 2 === 0
                                            ? 'bg-theme-1/10'
                                            : 'bg-transparent'
                                )}
                                style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
                            >
                                <td className="px-3 py-1.5 font-mono text-xs text-gray-7">
                                    {formatCellTime(row.timestamp)}
                                </td>
                                {selectedKeys.map((key) => (
                                    <td key={key} className="px-3 py-1.5 font-mono tabular-nums">
                                        {row.values[key] ?? '—'}
                                    </td>
                                ))}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
