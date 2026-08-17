import { create } from 'zustand';
import { RTEventMgrInst } from '@/services/RealTimeEvent';

interface AISugMessage {
    id: number
    type: string
    content: string
    timestamp: string
}

interface AISugMessageStore {
    idList: number[]
    messageByID: Record<number, AISugMessage>

    addMessage: (payload: AISugMessage) => void;
}

export const useAISugMessage = create<AISugMessageStore>((set) => ({
    idList: [],
    messageByID: {},
    addMessage: (payload: AISugMessage) => {
        if (!payload || !payload.id) return;
        set((state) => ({
            idList: [...state.idList, payload.id],
            messageByID: {
                ...state.messageByID,
                [payload.id]: payload
            }
        }));
    }
}));

RTEventMgrInst.handle<AISugMessage>("ai.message", (payload: AISugMessage) => {
    useAISugMessage.getState().addMessage(payload);
});