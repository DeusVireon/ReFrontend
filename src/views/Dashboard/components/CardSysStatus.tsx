import { cn } from '@/lib/utils'
import { useSystemStatus } from '../stores/SystemStatus'

export function CardSysStatus() {
    const systemStatus = useSystemStatus((state) => state.systemStatus);
    return (
        <div className="grid gap-1.5 text-sm">
            <StatusBadge name="后端服务" text={systemStatus.BackendText} color={systemStatus.BackendStatus} />
            <StatusBadge name="约束分析" text={systemStatus.HistoryAnalyzerText} color={systemStatus.HistoryAnalyzerStatus} />
            <StatusBadge name="预测模型" text={systemStatus.PredictorText} color={systemStatus.PredictorStatus} />
        </div>
    )
}

function StatusBadge({ name, text, color }: { name: string; text: string; color: number }) {
    return (
        <div key={text} className="animate-flash-highlight items-center gap-2">
            <div className={cn(
                "flex rounded-xs px-2 py-1 w-full \
                border border-gray-3/35"
                , {
                    "bg-attention-dark/60": color === 0,
                    "bg-gray-4/60": color === 1,
                    "bg-negative-dark/60": color === -1,
                })}>
                <div className="font-bold pr-2">{name}: </div>
                {text}
            </div>
        </div>
    )
}