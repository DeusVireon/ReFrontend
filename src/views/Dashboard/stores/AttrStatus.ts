import { create } from 'zustand';
import { RTEventMgrInst } from '@/services/RealTimeEvent'

interface AttrStatus {
    key: string
    status: number
    lastUpdated: string
    linkedAlerts: number[]
}

interface AttrStatusStore {
    statusByKey: Record<string, AttrStatus>

    getStatusByKey: (key: string) => AttrStatus | undefined;
}

export const useAttrStatusStore = create<AttrStatusStore>((set, get) => ({
    statusByKey: {},
    getStatusByKey: (key: string) => {
        const status = get().statusByKey[key];
        return status;
    }
}));

RTEventMgrInst.handle<AttrStatus>("sensor.attrs", (payload: AttrStatus) => {
    useAttrStatusStore.getState().statusByKey[payload.key] = payload;
})