import { RTEventMgrInst } from '@/services/RealTimeEvent';
import { create } from 'zustand';

interface SystemStatus {
    BackendStatus: number;
    HistoryAnalyzerStatus: number;
    PredictorStatus: number;
    BackendText: string;
    HistoryAnalyzerText: string;
    PredictorText: string;
}

interface SystemStatusStore {
    systemStatus: SystemStatus;

    updateSystemStatus: (payload: SystemStatus) => void;
}

export const useSystemStatus = create<SystemStatusStore>((set) => ({
    systemStatus: {
        BackendStatus: 0,
        HistoryAnalyzerStatus: 0,
        PredictorStatus: 0,
        BackendText: "Unknown",
        HistoryAnalyzerText: "Unknown",
        PredictorText: "Unknown",
    },
    updateSystemStatus: (payload: SystemStatus) => set((state) => ({
        systemStatus: {
            ...state.systemStatus,
            ...payload
        }
    }))
}));

RTEventMgrInst.handle<SystemStatus>("system.status", (payload: SystemStatus) => {
    console.log("Received system.status event:", payload);
    useSystemStatus.getState().updateSystemStatus(payload);
});