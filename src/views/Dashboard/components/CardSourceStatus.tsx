import { cn } from '@/lib/utils'
import { useSensorByID } from '../stores/SensorByID'
import { useShallow } from 'zustand/react/shallow';

export function CardSourceStatus() {
    return (
        <div className="grid gap-2">


            {/* <MatrixGrid items={Array.from({ length: 23 }, (_, i) => ({
                id: i + 1,
                status: Math.floor(Math.random() * 2),
            }))} /> */}
            <div className="text-gray-7 text-right">Sensor Total: 23</div>
        </div>
    )
}

function MatrixGrid({ items }: { items: Array<{ id: number; status: number }> }) {
    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(18px,1fr))] gap-1.5">
            {items.map((item) => (
                <div
                    key={item.id}
                    className={cn(
                        "aspect-square border rounded-xs hover:scale-105 overflow-hidden",
                        {
                            'bg-attention/60': item.status === 0,
                            'bg-negative/60': item.status === -1,
                            'bg-positive/60': item.status === 1,
                        },
                    )}
                >
                </div>
            ))}
        </div>
    )
}

function SensorStatusCell() {
    // const ids = useMatrixStore(useShallow((state) => state.ids));
}