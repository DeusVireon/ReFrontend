export const CSV_COLUMNS = {
    BACKEND_STATUS: 0,
    HISTORY_ANALYZER_STATUS: 1,
    PREDICTOR_STATUS: 2,
    BACKEND_TEXT: 3,
    HISTORY_ANALYZER_TEXT: 4,
    PREDICTOR_TEXT: 5,
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