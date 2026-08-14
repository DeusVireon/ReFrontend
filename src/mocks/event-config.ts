import { COL_INDEX, createSseEvent } from './types';
import { useRefClock } from '@/stores/ReferenceClock';

type ExtractEventMap<T extends readonly { event: string }[]> = {
    [K in T[number]['event']]: string;
};

export type AppSseEvents = ExtractEventMap<typeof registeredEvents>;

export const systemStatusEvent = createSseEvent({
    event: 'system.status',
    parse: (cells) => {
        const raw = {
            BackendStatus: cells[COL_INDEX.SystemStatusFrom] as number | null,
            HistoryAnalyzerStatus: cells[COL_INDEX.SystemStatusFrom + 1] as number | null,
            PredictorStatus: cells[COL_INDEX.SystemStatusFrom + 2] as number | null,
            BackendText: cells[COL_INDEX.SystemStatusFrom + 3] as string | null,
            HistoryAnalyzerText: cells[COL_INDEX.SystemStatusFrom + 4] as string | null,
            PredictorText: cells[COL_INDEX.SystemStatusFrom + 5] as string | null,
        };

        const validEntries = Object.entries(raw).filter(
            ([_, v]) => v !== null && v !== undefined
        );

        return validEntries.length > 0 ? Object.fromEntries(validEntries) : null;
    },
});

export interface SensorItem {
    id: string;
    status: number;
    attrKey: string;
    lastUpdated: string;
    value: number;
}

export interface SensorByIDPayload {
    sensors: SensorItem[];
}

// -------------------------------------------------------------
// 单源真理：将 1~22 号传感器 ID、attrKey 与 CSV 列索引映射关联
// 假设 CSV 中偶数列为 value，奇数列为 status（可根据实际 CSV 布局调整）
// -------------------------------------------------------------
export const SENSOR_SCHEMA = [
    { id: '1', attrKey: 'ambient_temp', valCol: COL_INDEX.SensorDataFrom, statusCol: COL_INDEX.SensorDataStatusFrom },
    { id: '2', attrKey: 'ambient_humidity', valCol: COL_INDEX.SensorDataFrom + 1, statusCol: COL_INDEX.SensorDataStatusFrom + 1 },
    { id: '3', attrKey: 'ambient_pressure', valCol: COL_INDEX.SensorDataFrom + 2, statusCol: COL_INDEX.SensorDataStatusFrom + 2 },
    { id: '4', attrKey: 'coating_flow', valCol: COL_INDEX.SensorDataFrom + 3, statusCol: COL_INDEX.SensorDataStatusFrom + 3 },
    { id: '5', attrKey: 'coating_conc', valCol: COL_INDEX.SensorDataFrom + 4, statusCol: COL_INDEX.SensorDataStatusFrom + 4 },
    { id: '6', attrKey: 'coating_temp', valCol: COL_INDEX.SensorDataFrom + 5, statusCol: COL_INDEX.SensorDataStatusFrom + 5 },
    { id: '7', attrKey: 'coating_pressure', valCol: COL_INDEX.SensorDataFrom + 6, statusCol: COL_INDEX.SensorDataStatusFrom + 6 },
    { id: '8', attrKey: 'rotor_speed', valCol: COL_INDEX.SensorDataFrom + 7, statusCol: COL_INDEX.SensorDataStatusFrom + 7 },
    { id: '9', attrKey: 'adsorption_fan_power', valCol: COL_INDEX.SensorDataFrom + 8, statusCol: COL_INDEX.SensorDataStatusFrom + 8 },
    { id: '10', attrKey: 'desorption_fan_power', valCol: COL_INDEX.SensorDataFrom + 9, statusCol: COL_INDEX.SensorDataStatusFrom + 9 },
    { id: '11', attrKey: 'rotor_inlet_temp', valCol: COL_INDEX.SensorDataFrom + 10, statusCol: COL_INDEX.SensorDataStatusFrom + 10 },
    { id: '12', attrKey: 'rotor_inlet_humid', valCol: COL_INDEX.SensorDataFrom + 11, statusCol: COL_INDEX.SensorDataStatusFrom + 11 },
    { id: '13', attrKey: 'desorption_temp', valCol: COL_INDEX.SensorDataFrom + 12, statusCol: COL_INDEX.SensorDataStatusFrom + 12 },
    { id: '14', attrKey: 'concentrated_flow', valCol: COL_INDEX.SensorDataFrom + 13, statusCol: COL_INDEX.SensorDataStatusFrom + 13 },
    { id: '15', attrKey: 'concentrated_conc', valCol: COL_INDEX.SensorDataFrom + 14, statusCol: COL_INDEX.SensorDataStatusFrom + 14 },
    { id: '16', attrKey: 'concentrated_temp', valCol: COL_INDEX.SensorDataFrom + 15, statusCol: COL_INDEX.SensorDataStatusFrom + 15 },
    { id: '17', attrKey: 'concentrated_pressure', valCol: COL_INDEX.SensorDataFrom + 16, statusCol: COL_INDEX.SensorDataStatusFrom + 16 },
    { id: '18', attrKey: 'rto_in_flow', valCol: COL_INDEX.SensorDataFrom + 17, statusCol: COL_INDEX.SensorDataStatusFrom + 17 },
    { id: '19', attrKey: 'rto_in_conc', valCol: COL_INDEX.SensorDataFrom + 18, statusCol: COL_INDEX.SensorDataStatusFrom + 18 },
    { id: '20', attrKey: 'rto_in_temp', valCol: COL_INDEX.SensorDataFrom + 19, statusCol: COL_INDEX.SensorDataStatusFrom + 19 },
    { id: '21', attrKey: 'rto_in_pressure', valCol: COL_INDEX.SensorDataFrom + 20, statusCol: COL_INDEX.SensorDataStatusFrom + 20 },
    { id: '22', attrKey: 'burner_gas_flow', valCol: COL_INDEX.SensorDataFrom + 21, statusCol: COL_INDEX.SensorDataStatusFrom + 21 },
    { id: '23', attrKey: 'combustion_temp', valCol: COL_INDEX.SensorDataFrom + 22, statusCol: COL_INDEX.SensorDataStatusFrom + 22 },
    { id: '24', attrKey: 'rto_out_temp', valCol: COL_INDEX.SensorDataFrom + 23, statusCol: COL_INDEX.SensorDataStatusFrom + 23 },
    { id: '25', attrKey: 'rto_out_conc', valCol: COL_INDEX.SensorDataFrom + 24, statusCol: COL_INDEX.SensorDataStatusFrom + 24 },
] as const;

// -------------------------------------------------------------
// 定义 sensor.upload 事件配置
// -------------------------------------------------------------
export const sensorUploadEvent = createSseEvent({
    event: 'sensor.update',
    parse: (cells): SensorByIDPayload | null => {
        const lastUpdated = useRefClock.getState().getISOString();
        const sensors: SensorItem[] = [];

        for (const sensorDef of SENSOR_SCHEMA) {
            const rawValue = cells[sensorDef.valCol];

            // 跳过单元格为空的传感器数据帧
            if (rawValue === null || rawValue === undefined || typeof rawValue !== 'number') {
                continue;
            }

            const rawStatus = cells[sensorDef.statusCol];
            const status = typeof rawStatus === 'number' ? rawStatus : 1;

            sensors.push({
                id: sensorDef.id,
                status,
                attrKey: sensorDef.attrKey,
                lastUpdated,
                value: rawValue,
            });
        }
        // 若当前时间点无有效传感器上报，返回 null 阻止推送空事件
        return sensors.length > 0 ? { sensors } : null;
    },
});

export const overallStatusEvent = createSseEvent({
    event: 'system.overall',
    parse: (cells) => {
        const raw = {
            sysStatus: cells[COL_INDEX.SystemOverall] as number | null,
            sysPrompt: cells[COL_INDEX.SystemOverall + 1] as string | null
                === "<EMPTY>" ? "" : cells[COL_INDEX.SystemOverall + 1] as string | null,
            bizStatus: cells[COL_INDEX.SystemOverall + 2] as number | null,
            bizPrompt: cells[COL_INDEX.SystemOverall + 3] as string | null
                === "<EMPTY>" ? "" : cells[COL_INDEX.SystemOverall + 3] as string | null,
        };


        const validEntries = Object.entries(raw).filter(
            ([_, v]) => v !== null && v !== undefined
        );


        return validEntries.length > 0 ? Object.fromEntries(validEntries) : null;
    },
});

export const systemLogEvent = createSseEvent({
    event: 'system.log',
    parse: (cells) => {
        const raw = {
            id: cells[COL_INDEX.SystemLog] as number | null,
            name: cells[COL_INDEX.SystemLog + 1] as string | null,
            content: cells[COL_INDEX.SystemLog + 2] as string | null,
            level: cells[COL_INDEX.SystemLog + 3] as number | null,
            triggerTime: new Date().toISOString()
        };

        const validEntries = Object.entries(raw).filter(
            ([_, v]) => v !== null && v !== undefined
        );

        return validEntries.length > 0 ? Object.fromEntries(validEntries) : null;
    },
});

export const alertDataEvent = createSseEvent({
    event: 'alert.data',
    parse: (cells) => {
        const raw = {
            id: cells[COL_INDEX.AlertDataFrom] as number | null,
            title: cells[COL_INDEX.AlertDataFrom + 1] as string | null,
            content: cells[COL_INDEX.AlertDataFrom + 2] as string | null,
            level: cells[COL_INDEX.AlertDataFrom + 3] as number | null,
            triggerTime: new Date().toISOString()
        };

        const validEntries = Object.entries(raw).filter(
            ([_, v]) => v !== null && v !== undefined
        );

        return validEntries.length > 0 ? Object.fromEntries(validEntries) : null;
    },
});

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

export const predUpdateEvent = createSseEvent({
    event: 'predict.update',
    parse: (cells: unknown[]): PredictResult | null => {
        try {
            const maxExceedProbRaw = cells[COL_INDEX.PredDataFrom];
            const inputDataQuantityRaw = cells[COL_INDEX.PredDataFrom + 1];
            const predStepsRaw = cells[COL_INDEX.PredDataFrom + 2];


            if (!predStepsRaw) {
                return null;
            }

            const maxExceedProb = Number(maxExceedProbRaw);
            const inputDataQuantity = Number(inputDataQuantityRaw);

            // 解析单 cell 中的 JSON 字符串
            const rawSteps = typeof predStepsRaw === 'string'
                ? JSON.parse(predStepsRaw)
                : predStepsRaw;

            if (!Array.isArray(rawSteps)) {
                return null;
            }

            // 4. 校验并提取 PredSteps 数组中的每一个项
            const predSteps: PredictionStep[] = rawSteps.map((step: Record<string, unknown>) => {
                const offsetMs = Number(step?.offsetMs);
                const value = Number(step?.value);
                const lower90 = Number(step?.lower90);
                const upper90 = Number(step?.upper90);
                const q10 = Number(step?.q10);
                const q50 = Number(step?.q50);
                const q90 = Number(step?.q90);

                return { offsetMs, value, lower90, upper90, q10, q50, q90 };
            });

            return {
                AnchorTime: new Date().toISOString(),
                MaxExceedProb: maxExceedProb,
                InputDataQuantity: inputDataQuantity,
                PredSteps: predSteps,
            };
        } catch {
            return null;
        }
    }
})

interface AlertPopupData {
    triggerTime: number
    title: string
    level: number
    levelText: string
    keyValueColor: number
    keyValueTitle: string
    keyValueContent: string
    contentType: string
    content: string
}

export const alertPopupEvent = createSseEvent({
    event: 'alert.popup',
    parse: (cells) => {
        const raw = {
            type: cells[COL_INDEX.AlertPopupFrom] as string | null,
            title: cells[COL_INDEX.AlertPopupFrom + 1] as string | null,
            level: cells[COL_INDEX.AlertPopupFrom + 2] as number | null,
            levelText: cells[COL_INDEX.AlertPopupFrom + 3] as string | null,
            keyValueColor: cells[COL_INDEX.AlertPopupFrom + 4] as number | null,
            keyValueTitle: cells[COL_INDEX.AlertPopupFrom + 5] as string | null,
            keyValueContent: cells[COL_INDEX.AlertPopupFrom + 6] as string | null,
            contentType: cells[COL_INDEX.AlertPopupFrom + 7] as string | null,
            content: cells[COL_INDEX.AlertPopupFrom + 8] as string | null
        };

        if (!raw.type || !raw.title) {
            return null;
        }

        return {
            triggerTime: new Date().getTime(),
            type: raw.type,
            title: raw.title,
            level: raw.level ?? 0,
            levelText: raw.levelText ?? '',
            keyValueColor: raw.keyValueColor ?? 0,
            keyValueTitle: raw.keyValueTitle ?? '',
            keyValueContent: raw.keyValueContent ?? '',
            contentType: raw.contentType ?? '',
            content: raw.content ?? ''
        };
    }
});

export const registeredEvents = [
    systemStatusEvent,
    sensorUploadEvent,
    overallStatusEvent,
    systemLogEvent,
    alertDataEvent,
    alertPopupEvent,
    predUpdateEvent] as const;