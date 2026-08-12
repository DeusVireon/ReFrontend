import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface SectionProps {
    title: string
    description?: string
    actions?: ReactNode
    children: ReactNode
    className?: string
}

/** 整体页面布局结构 */
export function AnalyzeSection({ title, description, actions, children, className }: SectionProps) {
    return (
        <section
            className={cn(
                'rounded-md border-[1.5px] border-theme-1/20 bg-theme-2/50 p-4 text-text backdrop-blur-sm',
                className
            )}
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold">{title}</h2>
                    {description ? (
                        <p className="mt-0.5 text-sm text-gray-7">{description}</p>
                    ) : null}
                </div>
                {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
            </div>
            {children}
        </section>
    )
}
