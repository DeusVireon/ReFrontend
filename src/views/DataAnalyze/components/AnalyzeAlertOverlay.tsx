import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, ShieldAlert } from 'lucide-react'
import { RTEventMgrInst } from '@/services/RealTimeEvent'
import { useAnalyzeData } from '../stores/AnalyzeData'

interface AnalyzeAlert {
    id: number
    title: string
    content: string
    level: number
    triggerTime: string
    acknowledged?: boolean
}

function activateHighlight(alert: AnalyzeAlert) {
    const store = useAnalyzeData.getState()
    const times = store.series
        .map((point) => Date.parse(point.timestamp))
        .filter(Number.isFinite)
    if (times.length < 2) return
    const min = Math.min(...times)
    const max = Math.max(...times)
    const requested = Date.parse(alert.triggerTime)
    const center = Number.isFinite(requested)
        ? Math.min(max, Math.max(min, requested))
        : max
    const span = Math.max((max - min) * 0.08, 5 * 60_000)
    store.setHighlight({
        start: new Date(Math.max(min, center - span)).toISOString(),
        end: new Date(Math.min(max, center + span)).toISOString(),
        attrKeys: ['combustion_temp'],
        source: alert.title || 'alert.data',
    })
}

export function AnalyzeAlertOverlay() {
    const [alerts, setAlerts] = useState<AnalyzeAlert[]>([])

    useEffect(() => RTEventMgrInst.handle<AnalyzeAlert>('alert.data', (alert) => {
        activateHighlight(alert)
        setAlerts((current) => [
            alert,
            ...current.filter((candidate) => candidate.id !== alert.id),
        ])
    }), [])

    const topPending = useMemo(
        () => alerts.find((alert) => !alert.acknowledged) ?? null,
        [alerts],
    )
    const alertExpanded = Boolean(topPending)

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-[80]">
            <motion.div
                layout
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                className={[
                    'pointer-events-auto flex shrink-0 flex-row items-stretch overflow-hidden rounded-xl',
                    'border border-[var(--glass-border)] bg-[var(--glass-background)] backdrop-blur-2xl backdrop-saturate-150',
                    'shadow-[var(--glass-shadow)]',
                    alertExpanded
                        ? 'min-h-[72px] h-auto w-[min(520px,calc(100vw-2rem))]'
                        : 'h-[72px] w-[72px]',
                ].join(' ')}
            >
                <button
                    type="button"
                    className={[
                        'flex shrink-0 items-center justify-center transition-colors',
                        alertExpanded ? 'w-14 self-stretch border-r border-[var(--glass-border)]' : 'w-full',
                        topPending ? 'bg-rose-500/10 text-rose-400' : 'text-gray-7 hover:bg-white/5 hover:text-text',
                    ].join(' ')}
                    aria-label={topPending ? '预警待确认' : '无待处理预警'}
                >
                    {topPending ? (
                        <ShieldAlert className="h-7 w-7 animate-pulse" />
                    ) : (
                        <Bell className="h-6 w-6" />
                    )}
                </button>

                <AnimatePresence initial={false}>
                    {topPending ? (
                        <motion.div
                            key={topPending.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                            className="flex min-h-[72px] min-w-0 flex-1 flex-row items-stretch"
                        >
                            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-2 pl-3 pr-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className={[
                                        'shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase',
                                        topPending.level >= 3
                                            ? 'border-negative/50 bg-negative/15 text-negative'
                                            : topPending.level === 2
                                                ? 'border-attention/50 bg-attention/15 text-attention'
                                                : 'border-accent/50 bg-accent/15 text-accent-light',
                                    ].join(' ')}>
                                        L{topPending.level}
                                    </span>
                                    <span className="truncate text-xs font-semibold text-text">{topPending.title}</span>
                                    <span className="ml-auto shrink-0 font-mono text-[10px] text-gray-7">#{topPending.id}</span>
                                </div>
                                <p className="line-clamp-3 text-[11px] leading-snug text-gray-7">{topPending.content}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAlerts((current) =>
                                    current.map((alert) =>
                                        alert.id === topPending.id ? { ...alert, acknowledged: true } : alert,
                                    ),
                                )}
                                className="flex w-12 shrink-0 items-center justify-center border-l border-[var(--glass-border)] bg-accent/35 px-1 text-[11px] font-semibold tracking-wide text-white transition-colors hover:bg-accent/55"
                            >
                                <span className="select-none [writing-mode:vertical-rl]">确认预警</span>
                            </button>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
