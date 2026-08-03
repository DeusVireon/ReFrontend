import { RTEventMgrInst } from '@/services/RealTimeEvent';
import { create } from 'zustand';

interface AlertData {
    id: number
    title: string
    content: string
    level: number
    triggerTime: string
}

interface AlertDataStore {
    idList: number[]
    alertByID: Record<number, AlertData>

    addAlert: (payload: AlertData) => void;
}

export const useAlertData = create<AlertDataStore>((set) => ({
    idList: [],
    alertByID: {},

    addAlert: (payload: AlertData) => {
        if (!payload || !payload.id) return;
        set((state) => {
            const nextAlertByID = {
                ...state.alertByID,
                [payload.id]: payload
            };

            // 过滤掉旧的 payload.id（如果存在），并将 payload.id 插入到最前面
            const nextIDList = [
                payload.id,
                ...state.idList.filter((id) => id !== payload.id)
            ];

            return {
                alertByID: nextAlertByID,
                idList: nextIDList,
            };
        });
    }
}));

RTEventMgrInst.handle<AlertData>("alert.data", (payload: AlertData) => {
    console.log("Received alert.data event:", payload);
    useAlertData.getState().addAlert(payload);
});