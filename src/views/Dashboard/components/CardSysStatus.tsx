import { cn } from '@/lib/utils'

export function CardSysStatus() {
    return (
        <div className="grid gap-1.5 text-sm">
            <StatusBadge name="后端服务" text="正常连接" color={1} />
            <StatusBadge name="约束模型" text="载入 30 条规则" color={0} />
            <StatusBadge name="预测模型" text="离线 PAR-PFT" color={-1} />
        </div>
    )
}

function StatusBadge({ name, text, color }: { name: string; text: string; color: number }) {
    return (
        <div className="items-center gap-2">
            <div className={cn(
                "flex rounded-xs px-2 py-1 w-full \
                border border-gray-3/35"
                , {
                    "bg-attention/35": color === 0,
                    "bg-gray-4/35": color === 1,
                    "bg-negative/35": color === -1,
                })}>
                <div className="font-bold pr-2">{name}: </div>
                {text}
            </div>
        </div>
    )
}