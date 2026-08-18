
export const COL_INDEX = {
    SensorDataFrom: 0,
    SensorDataStatusFrom: 25,
    SystemStatusFrom: 50,
    SystemOverall: 56,
    SystemLog: 60,
    AlertDataFrom: 64,
    AlertPopupFrom: 68,
    AttrStatusFrom: 77,
    PredDataFrom: 80,
    AIMessageFrom: 83,
    AIToolFrom: 86
} as const;

export type CellValue = string | number | boolean | null;

export interface FrameRecord {
    offsetMs: number;
    cells: CellValue[];
}

export type SpecialConfig = Record<string, string>;

export interface ParsedCsvResult {
    config: SpecialConfig;
    records: FrameRecord[];
}

// 零依赖本地定义：只需保证传入的对象拥有 send 方法即可
export interface SseClient<E extends string = string> {
    send(message: { event?: E; data: string; id?: string }): void;
}

export interface SseEventOptions<E extends string, T> {
    event: E;
    parse: (cells: CellValue[]) => T | null;
    serialize?: (data: T) => string;
}

export function createSseEvent<E extends string, T>(options: SseEventOptions<E, T>) {
    const serialize = options.serialize ?? JSON.stringify;

    return {
        event: options.event,
        parse: options.parse,
        emit(client: SseClient<E>, cells: CellValue[]): T | null {
            const payload = options.parse(cells);
            if (payload !== null) {
                client.send({
                    event: options.event,
                    data: serialize(payload),
                });
            }
            return payload;
        },
    };
}