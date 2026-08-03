import { RTEventMgrInst } from '@/services/RealTimeEvent';
import { create } from 'zustand';

interface LogData {
    id: number
    name: string
    content: string
    level: number
    triggerTime: string
}

interface LogDataStore {
    idList: number[]
    logByID: Record<number, LogData>

    addLog: (payload: LogData) => void;
}

export const useLogData = create<LogDataStore>((set) => ({
    idList: [],
    logByID: {},

    addLog: (payload: LogData) => {
        if (!payload || !payload.id) return;
        set((state) => {
            const nextAlertByID = {
                ...state.logByID,
                [payload.id]: payload
            };

            // 过滤掉旧的 payload.id（如果存在），并将 payload.id 插入到最前面
            let nextIDList = [
                payload.id,
                ...state.idList.filter((id) => id !== payload.id)
            ];

            // 超出 100 条时截取前 100 条，并同步清除超出部分的字典数据
            if (nextIDList.length > 100) {
                const removedIDs = nextIDList.slice(100);
                nextIDList = nextIDList.slice(0, 100);

                removedIDs.forEach((id) => {
                    delete nextAlertByID[id];
                });
            }

            return {
                logByID: nextAlertByID,
                idList: nextIDList,
            };
        });
    }
}));

RTEventMgrInst.handle<LogData>("system.log", (payload: LogData) => {
    useLogData.getState().addLog(payload);
});