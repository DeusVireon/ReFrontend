import { CSV_COLUMNS, createSseEvent } from './types';

export interface SystemStatusPayload {
    BackendStatus: number | null;
    HistoryAnalyzerStatus: number | null;
    PredictorStatus: number | null;
    BackendText: string | null;
    HistoryAnalyzerText: string | null;
    PredictorText: string | null;
}

export const systemStatusEvent = createSseEvent({
    event: 'system_status',
    parse: (cells) => {
        const targetValues = cells.slice(0, 6);
        if (targetValues.every((val) => val === null)) {
            return null;
        }

        return {
            BackendStatus: cells[CSV_COLUMNS.BACKEND_STATUS] as number | null,
            HistoryAnalyzerStatus: cells[CSV_COLUMNS.HISTORY_ANALYZER_STATUS] as number | null,
            PredictorStatus: cells[CSV_COLUMNS.PREDICTOR_STATUS] as number | null,
            BackendText: cells[CSV_COLUMNS.BACKEND_TEXT] as string | null,
            HistoryAnalyzerText: cells[CSV_COLUMNS.HISTORY_ANALYZER_TEXT] as string | null,
            PredictorText: cells[CSV_COLUMNS.PREDICTOR_TEXT] as string | null,
        };
    },
});

export const registeredEvents = [systemStatusEvent] as const;

type ExtractEventMap<T extends readonly { event: string }[]> = {
    [K in T[number]['event']]: string;
};

export type AppSseEvents = ExtractEventMap<typeof registeredEvents>;