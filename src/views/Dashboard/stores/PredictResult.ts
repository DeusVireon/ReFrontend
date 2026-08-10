import { create } from 'zustand';
import { RTEventMgrInst } from '@/services/RealTimeEvent';

interface PredictionStep {
    offsetMs: number;
    value: number;
    lower90: number;
    upper90: number;
    q10: number;
    q50: number;
    q90: number;
}

interface PredictResult {
    AnchorTime: string;
    MaxExceedProb: number;
    InputDataQuantity: number;
    PredSteps: PredictionStep[];
}

interface PredictResultStore {
    predictResult: PredictResult | null;
    setPredictResult: (predictResult: PredictResult | null) => void;
}

export const usePredictResult = create<PredictResultStore>((set) => ({
    predictResult: null,
    setPredictResult: (predictResult: PredictResult | null) => set({ predictResult }),
}));

RTEventMgrInst.handle<PredictResult>("predict.update", (payload: PredictResult) => {
    usePredictResult.getState().setPredictResult(payload);
});