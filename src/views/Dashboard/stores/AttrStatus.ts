import { create } from 'zustand';
import { RTEventMgrInst } from '@/services/RealTimeEvent'
import { ModelPartEnum } from '../models/ModelPartEnum';
import { BOARD_PROP_MAP } from '../models/BoardPropMap';

interface AttrStatus {
    key: string
    status: number
    lastUpdated: string
    linkedAlerts: number[]
}

interface AttrStatusStore {
    statusByKey: Record<string, AttrStatus>
    lastUpdated: number

    setStatus: (payload: AttrStatus) => void;
    getStatusByKey: (key: string) => AttrStatus | undefined;
    getStatusByGroup: (group: ModelPartEnum) => AttrStatus;
}

export const useAttrStatusStore = create<AttrStatusStore>((set, get) => ({
    statusByKey: {},
    lastUpdated: 0,
    setStatus: (payload: AttrStatus) => {
        if (!payload || !payload.key) return;
        set((state) => {
            return {
                statusByKey: {
                    ...state.statusByKey,
                    [payload.key]: payload
                },
                lastUpdated: Date.now()
            };
        });
    },
    getStatusByKey: (key: string) => {
        const status = get().statusByKey[key];
        return status;
    },
    getStatusByGroup: (group: ModelPartEnum): AttrStatus => {
        // 1. 安全获取组配置
        const groupConfig = BOARD_PROP_MAP[group];
        const linkedData = groupConfig?.linkedData ?? [];

        // 2. 收集该 Group 下所有已存在的 AttrStatus
        const { statusByKey } = get();
        const subStatuses: AttrStatus[] = [];

        for (const item of linkedData) {
            const status = statusByKey[item.attrKey];
            if (status) {
                subStatuses.push(status);
            }
        }

        // 3. 处理空值/无下属状态的默认情况
        if (subStatuses.length === 0) {
            return {
                key: group,
                status: 0,
                lastUpdated: '',
                linkedAlerts: [],
            };
        }

        // 4. 计算 status（取最大值）
        const maxStatus = Math.max(...subStatuses.map((s) => s.status));

        // 5. 计算 linkedAlerts（去重并集）
        const alertSet = new Set<number>();
        for (const s of subStatuses) {
            if (Array.isArray(s.linkedAlerts)) {
                for (const alertId of s.linkedAlerts) {
                    alertSet.add(alertId);
                }
            }
        }

        // 6. 计算 lastUpdated（取最新时间戳）
        const latestUpdated = subStatuses.reduce((latest, curr) => {
            if (!latest) return curr.lastUpdated ?? '';
            if (!curr.lastUpdated) return latest;
            return curr.lastUpdated > latest ? curr.lastUpdated : latest;
        }, '');

        return {
            key: group,
            status: Number.isFinite(maxStatus) ? maxStatus : 0,
            lastUpdated: latestUpdated,
            linkedAlerts: Array.from(alertSet),
        };
    }
}));

RTEventMgrInst.handle<AttrStatus>("sensor.attrs", (payload: AttrStatus) => {
    useAttrStatusStore.getState().setStatus(payload);
})