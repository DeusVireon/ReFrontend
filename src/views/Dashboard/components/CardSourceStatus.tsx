import { cn } from '@/lib/utils'
import { memo } from 'react';
import { useSensorData } from '../stores/SensorData'
import { useShallow } from 'zustand/react/shallow';

export function CardSourceStatus() {
    const ids = useSensorData(useShallow((state) => state.idList));
    return (
        <div className="grid gap-2">
            <MatrixGrid />
            <div className="text-gray-7 text-right">Sensor Total: {ids.length}</div>
        </div>
    )
}

function MatrixGrid() {

    const ids = useSensorData(useShallow((state) => state.idList));

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(18px,1fr))] gap-1.5">
            {ids.map((item) => (
                <SensorStatusCellMemo key={item} id={item} />
            ))}
        </div>
    )
}

const SensorStatusCellMemo = memo(SensorStatusCell)

function SensorStatusCell({ id }: { id: string }) {
    const status = useSensorData(useShallow((state) => state.sensorByID[id]));

    if (!status) {
        return null;
    }

    return (
        <div key={status.lastUpdated}
            className={cn(
                "sensor-status-cell animate-flash-highlight aspect-square rounded-xs hover:scale-105 overflow-hidden",
                {
                    'sensor-status-attention': status.status === 0,
                    'sensor-status-negative': status.status === -1,
                    'sensor-status-positive': status.status === 1,
                },
            )}
        >
        </div>
    )
}
