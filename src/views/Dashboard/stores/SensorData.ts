import { create } from 'zustand';
import { RTEventMgrInst } from '@/services/RealTimeEvent'

interface SensorInfo {
    id: string
    status: number
    attrKey: string
    lastUpdated: string
    value: string
}

interface DataPoint {
    value: number
    timestamp: string
}

export interface AttrDataHistory {
    history: DataPoint[]
    latestValue: DataPoint | null
    lastUpdated: string
}

interface SensorInfos {
    sensors: SensorInfo[];
}

interface SensorDataStore {
    idList: string[]
    sensorByID: Record<string, SensorInfo>
    attrHistory: Record<string, AttrDataHistory> // attrKey -> history data
    attrMap: Record<string, string> // attrKey -> sensorID

    updateSensors: (payload: SensorInfos) => void;
    getDataByAttrKey: (attrKey: string) => AttrDataHistory | undefined;
}

const MAX_HISTORY_POINTS = 100;

export const useSensorData = create<SensorDataStore>((set, get) => ({
    idList: [],
    sensorByID: {},
    attrHistory: {},
    attrMap: {},

    updateSensors: (payload: SensorInfos) => {
        if (!Array.isArray(payload.sensors) || payload.sensors.length === 0) return;

        set((state) => {
            const nextSensorByID = { ...state.sensorByID };
            const nextAttrMap = { ...state.attrMap };
            const nextAttrHistory = { ...state.attrHistory };
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

                // 更新 attrMap 映射关系并写入/追加历史记录
                if (item.attrKey) {
                    nextAttrMap[item.attrKey] = item.id;

                    const numVal = Number(item.value);
                    // 确保 value 可以合法转换为数字再写入历史
                    if (!isNaN(numVal)) {
                        const newDataPoint: DataPoint = {
                            value: numVal,
                            timestamp: item.lastUpdated,
                        };

                        const currentAttrHistory = nextAttrHistory[item.attrKey] || {
                            history: [],
                            latestValue: null,
                            lastUpdated: '',
                        };

                        // 保留最新 100 个数据点
                        const updatedHistory = [...currentAttrHistory.history, newDataPoint].slice(-MAX_HISTORY_POINTS);

                        nextAttrHistory[item.attrKey] = {
                            history: updatedHistory,
                            latestValue: newDataPoint,
                            lastUpdated: item.lastUpdated,
                        };
                    }
                }
            }

            const nextIDList = newIds.length > 0 ? [...state.idList, ...newIds] : state.idList;

            return {
                sensorByID: nextSensorByID,
                attrMap: nextAttrMap,
                idList: nextIDList,
                attrHistory: nextAttrHistory,
            };
        });
    },

    getDataByAttrKey: (attrKey: string) => {
        return get().attrHistory[attrKey];
    },
}));


RTEventMgrInst.handle<SensorInfos>("sensor.update", (payload: SensorInfos) => {
    useSensorData.getState().updateSensors(payload);
})