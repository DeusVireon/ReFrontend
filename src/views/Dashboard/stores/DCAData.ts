import { create } from "zustand"
import { RTEventMgrInst } from "@/services/RealTimeEvent"
import type { DCASnapshot } from "../models/DCA"

interface DCADataStore {
    snapshot: DCASnapshot | null
    updateCount: number
    updateSnapshot: (snapshot: DCASnapshot) => void
}

export const useDCAData = create<DCADataStore>((set) => ({
    snapshot: null,
    updateCount: 0,
    updateSnapshot: (snapshot) => set((state) => ({
        snapshot,
        updateCount: state.updateCount + 1,
    })),
}))

RTEventMgrInst.handle<DCASnapshot>("dca.update", (payload) => {
    useDCAData.getState().updateSnapshot(payload)
})
