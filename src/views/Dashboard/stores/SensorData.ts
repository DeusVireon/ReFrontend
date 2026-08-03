import { create } from 'zustand';
import { RTEventMgrInst } from '@/services/RealTimeEvent'

interface SensorInfo {
    id: string
    status: number
    attrKey: string
    lastUpdated: string
    value: string
}

interface SensorInfos {
    sensors: SensorInfo[];
}

interface SensorDataStore {
    idList: string[]
    sensorByID: Record<string, SensorInfo>
    attrMap: Record<string, string> // attrKey -> sensorID

    updateSensors: (payload: SensorInfos) => void;
}

export const useSensorData = create<SensorDataStore>((set) => ({
    idList: [],
    sensorByID: {},
    attrMap: {},

    updateSensors: (payload: SensorInfos) => {
        if (!Array.isArray(payload.sensors) || payload.sensors.length === 0) return;
        set((state) => {
            const nextSensorByID = { ...state.sensorByID };
            const nextAttrMap = { ...state.attrMap };
            const newIds: string[] = [];

            for (const item of payload.sensors) {
                if (!item || !item.id) continue;
                // 判断是否为新的传感器
                const existingSensor = state.sensorByID[item.id];
                const isNew = !existingSensor;
                // 如果 attrKey 发生变更，抹除旧的映射关系
                if (existingSensor?.attrKey && existingSensor.attrKey !== item.attrKey) {
                    delete nextAttrMap[existingSensor.attrKey];
                }
                // 覆盖/更新当前传感器的状态
                nextSensorByID[item.id] = {
                    ...existingSensor,
                    ...item,
                };
                // 如果是全新传感器，记录其 ID
                if (isNew) {
                    newIds.push(item.id);
                }
                // 更新 attrMap 映射关系
                if (item.attrKey) {
                    nextAttrMap[item.attrKey] = item.id;
                }
            }
            const nextIDList = newIds.length > 0 ? [...state.idList, ...newIds] : state.idList
            return {
                sensorByID: nextSensorByID,
                attrMap: nextAttrMap,
                idList: nextIDList,
            };
        });
    },
}));


RTEventMgrInst.handle<SensorInfos>("sensor.update", (payload: SensorInfos) => {
    useSensorData.getState().updateSensors(payload);
})