import { cn } from '@/lib/utils'
import { FIELD_GROUPS, FIELD_META_MAP } from '../models/AnalyzeTypes'
import { useAnalyzeData } from '../stores/AnalyzeData'
//按钮选择和指标摘要部分
export function FieldSelector() {
    const selectedKeys = useAnalyzeData((s) => s.selectedKeys)
    const toggleKey = useAnalyzeData((s) => s.toggleKey)
    const setGroupKeys = useAnalyzeData((s) => s.setGroupKeys)

    return (
        <div className="grid gap-3">
            {FIELD_GROUPS.map((group) => {
                const activeCount = group.keys.filter((k) => selectedKeys.includes(k)).length
                const allOn = activeCount === group.keys.length

                return (
                    <div key={group.id} className="animate-expand-right">
                        <div className="mb-1.5 flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-7">{group.label}</span>
                            <button
                                type="button"
                                onClick={() => setGroupKeys(group.keys, !allOn)}
                                className={cn(
                                    'rounded-xs border px-1.5 py-0.5 text-xs',
                                    allOn
                                        ? 'border-accent/50 bg-accent/20 text-text'
                                        : 'border-theme-1/30 bg-theme-1/20 text-gray-7 hover:bg-theme-1/40'
                                )}
                            >
                                {allOn ? '取消本组' : '全选本组'}
                            </button>
                            <span className="text-xs text-gray-7">
                                {activeCount}/{group.keys.length}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {group.keys.map((key) => {
                                const meta = FIELD_META_MAP[key]
                                const active = selectedKeys.includes(key)
                                if (!meta) return null

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => toggleKey(key)}
                                        className={cn(
                                            'rounded-xs border px-2 py-1 text-sm transition-colors',
                                            active
                                                ? 'border-accent/60 bg-accent/25 text-text'
                                                : 'border-theme-1/25 bg-theme-1/15 text-gray-7 hover:border-theme-1/50 hover:bg-theme-1/30'
                                        )}
                                    >
                                        {meta.label}
                                        <span className="ml-1 text-xs opacity-70">{meta.unit}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export function SelectedSummary() {
    // 只订阅稳定引用；禁止在 selector 内 map 出新对象，否则 useSyncExternalStore 会无限更新
    const selectedKeys = useAnalyzeData((s) => s.selectedKeys)
    const statsByKey = useAnalyzeData((s) => s.statsByKey)

    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {selectedKeys.map((key, index) => {
                const meta = FIELD_META_MAP[key]
                const stat = statsByKey[key]

                return (
                    <div
                        key={key}
                        className="animate-expand-right rounded-xs border border-theme-1/25 bg-theme-1/20 px-3 py-2"
                        style={{ animationDelay: `${index * 40}ms` }}
                    >
                        <div className="text-xs text-gray-7">{meta?.label ?? key}</div>
                        <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                            {stat ? stat.latest : '—'}
                            <span className="ml-1 text-sm font-normal text-gray-7">{meta?.unit}</span>
                        </div>
                        {stat ? (
                            <div className="mt-1 flex gap-2 text-xs text-gray-7">
                                <span>均 {stat.avg}</span>
                                <span>峰 {stat.max}</span>
                            </div>
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}
