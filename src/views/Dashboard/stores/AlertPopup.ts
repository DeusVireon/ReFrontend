import { create } from 'zustand';
import { RTEventMgrInst } from '@/services/RealTimeEvent';

interface AlertPopupData {
    triggerTime: number
    type: string
    title: string
    level: number
    levelText: string
    keyValueColor: number
    keyValueTitle: string
    keyValueContent: string
    contentType: string
    content: string
}

interface AlertPopupStore {
    currentPopup: AlertPopupData | null

    setCurrentPopup: (popupData: AlertPopupData | null) => void;
}

export const useAlertPopupStore = create<AlertPopupStore>((set) => ({
    currentPopup: null,

    setCurrentPopup: (popupData: AlertPopupData | null) => {
        set({ currentPopup: popupData });
    }
}));



RTEventMgrInst.handle<AlertPopupData>("alert.popup", (payload: AlertPopupData) => {
    useAlertPopupStore.getState().setCurrentPopup(payload);
});