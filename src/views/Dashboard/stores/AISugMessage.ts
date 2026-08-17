import { create } from 'zustand';
import { RTEventMgrInst } from '@/services/RealTimeEvent';

interface AISugMessage {
    id: number
    type: string
    content: string
    timestamp: string
}

interface AISugIndicator {
    indicator: number
}

interface AISugTip {
    showTip: string
}

interface AISugMessageStore {
    idList: number[]
    messageByID: Record<number, AISugMessage>
    indicator: number
    showTip: string

    setMessage: (payload: AISugMessage) => void;
    setIndicator: (value: number) => void;
    setShowTip: (value: string) => void;
}

export const useAISugMessage = create<AISugMessageStore>((set) => ({
    idList: [],
    messageByID: {},
    indicator: 0,
    showTip: "",
    setMessage: (payload: AISugMessage) => {
        if (!payload || !payload.id) return;
        set((state) => {
            const hasId = state.idList.includes(payload.id);
            return {
                idList: hasId ? state.idList : [...state.idList, payload.id],
                messageByID: {
                    ...state.messageByID,
                    [payload.id]: payload
                }
            };
        });
    },
    setIndicator: (value: number) => set({ indicator: value }),
    setShowTip: (value: string) => set({ showTip: value }),
}));

RTEventMgrInst.handle<AISugMessage>("ai.message", (payload: AISugMessage) => {
    useAISugMessage.getState().setMessage(payload);
});

RTEventMgrInst.handle<AISugIndicator>("ai.indicator", (payload: AISugIndicator) => {
    useAISugMessage.getState().setIndicator(payload.indicator);
});

RTEventMgrInst.handle<AISugTip>("ai.tip", (payload: AISugTip) => {
    useAISugMessage.getState().setShowTip(payload.showTip);
});