import { create } from 'zustand';

interface RefClock {
    anchorWallTime: number;
    anchorRefTime: number;
    anchorSetTick: number;
    refClockSpeed: number;

    setAnchor(speed: number, refTime?: number): void;
    getTime(): number;
    getDateObj(): Date;
    getISOString(): string;
}

export const useRefClock = create<RefClock>((set, get) => ({
    anchorWallTime: Date.now(),
    anchorRefTime: Date.now(),
    anchorSetTick: performance.now(),
    refClockSpeed: 1.0,
    setAnchor: (speed: number, refTime?: number) => set({
        anchorWallTime: Date.now(),
        anchorRefTime: refTime ?? Date.now(),
        anchorSetTick: performance.now(),
        refClockSpeed: speed
    }),
    getTime: () => {
        const { anchorWallTime, anchorRefTime, anchorSetTick, refClockSpeed } = get();
        const elapsedTime = performance.now() - anchorSetTick;
        const elapsedRefTime = elapsedTime * refClockSpeed;
        return anchorRefTime + elapsedRefTime;
    },
    getDateObj: () => {
        const refTime = get().getTime();
        return new Date(refTime);
    },
    getISOString: () => {
        const refTime = get().getTime();
        return new Date(refTime).toISOString();
    }
}));