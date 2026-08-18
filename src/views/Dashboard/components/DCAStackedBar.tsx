import { cn } from "@/lib/utils"
import {
    DCA_RULE_COLORS,
    type DCARuleResult,
    type DCAStatusLevel,
} from "../models/DCA"

interface DCAStackedBarProps {
    rules: DCARuleResult[]
    selectedRuleId?: string | null
    onSelectRule?: (ruleId: string) => void
    size?: "compact" | "detail"
}

export function DCAStackedBar({
    rules,
    selectedRuleId,
    onSelectRule,
    size = "compact",
}: DCAStackedBarProps) {
    const contributingRules = rules.filter((rule) => rule.score > 0)
    const total = contributingRules.reduce((sum, rule) => sum + rule.score, 0)

    if (total <= 0) {
        return (
            <div className={cn(
                "flex items-center justify-center rounded-sm bg-gray-4/25 text-xs text-gray-7",
                size === "detail" ? "h-9" : "h-5",
            )}>
                当前没有规则产生异常分数
            </div>
        )
    }

    return (
        <div className={cn("relative", size === "detail" ? "pb-9" : "pb-0")}>
            <div
                className={cn(
                    "flex w-full overflow-visible rounded-sm bg-gray-4/25 ring-1 ring-white/10",
                    size === "detail" ? "h-9" : "h-5",
                )}
                role="group"
                aria-label="DCA 规则异常分数构成"
            >
                {contributingRules.map((rule, index) => {
                    const percentage = (rule.score / total) * 100
                    const selected = rule.id === selectedRuleId
                    const color = DCA_RULE_COLORS[index % DCA_RULE_COLORS.length]

                    return (
                        <button
                            type="button"
                            key={rule.id}
                            className={cn(
                                "group relative h-full min-w-1 border-r border-theme-1/35 last:border-r-0",
                                "outline-none transition-[filter,transform] hover:brightness-125",
                                "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-white/80",
                                selected && "z-10 brightness-125 ring-2 ring-white/70",
                            )}
                            style={{
                                width: `${percentage}%`,
                                backgroundColor: color,
                            }}
                            onClick={() => onSelectRule?.(rule.id)}
                            aria-label={`${rule.name}，贡献 ${rule.score.toFixed(1)} 分`}
                        >
                            <span className="pointer-events-none absolute top-[calc(100%+0.35rem)] left-1/2 z-30 hidden w-max max-w-56 -translate-x-1/2 rounded-sm border border-theme-1/40 bg-theme-1/95 px-2 py-1 text-left text-xs text-text shadow-xl group-hover:block group-focus-visible:block">
                                <span className="block font-semibold">{rule.name}</span>
                                <span className="text-gray-7">
                                    贡献 {rule.score.toFixed(1)} 分 · {percentage.toFixed(1)}%
                                </span>
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

const STATUS_CLASS_NAMES: Record<DCAStatusLevel, string> = {
    normal: "border-positive-dark/70 bg-positive-dark/35 text-positive",
    attention: "border-accent/70 bg-accent/30 text-accent-light",
    warning: "border-attention-dark/70 bg-attention-dark/35 text-attention",
    critical: "border-negative-dark/75 bg-negative-dark/40 text-negative",
}

export function DCAStatusBadge({
    label,
    level,
    className,
}: {
    label: string
    level: DCAStatusLevel
    className?: string
}) {
    return (
        <span className={cn(
            "inline-flex h-6 shrink-0 items-center rounded-sm border px-2 text-xs font-medium",
            STATUS_CLASS_NAMES[level],
            className,
        )}>
            {label}
        </span>
    )
}
