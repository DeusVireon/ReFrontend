import { create } from "zustand";
import { RTEventMgrInst } from "@/services/RealTimeEvent";

interface OverallStatus {
    sysStatus: number;
    sysPrompt: string;
    bizStatus: number;
    bizPrompt: string;
}

interface OverallStatusStore {
    overallStatus: OverallStatus;

    updateOverallStatus: (payload: OverallStatus) => void;
}

export const useOverallStatus = create<OverallStatusStore>((set) => ({
    overallStatus: {
        sysStatus: -1,
        sysPrompt: "未连接",
        bizStatus: 0,
        bizPrompt: "Unknown",
    },
    updateOverallStatus: (payload: OverallStatus) => set((state) => ({
        overallStatus: {
            ...state.overallStatus,
            ...payload
        }
    }))
}));

RTEventMgrInst.handle<OverallStatus>("system.overall", (payload: OverallStatus) => {
    console.log("Received OverallStatus payload:", payload);
    useOverallStatus.getState().updateOverallStatus(payload);
});