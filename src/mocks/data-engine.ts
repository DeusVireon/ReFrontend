import { parseCsvContent } from './script-parser';
import { type FrameRecord, type ParsedCsvResult } from './types';
import { useRefClock } from '@/stores/ReferenceClock';

export class DataEngine {
    private startTime: number = Date.now();
    private parsedData: ParsedCsvResult = { config: {}, records: [] };
    private defaultWindowMs: number = 5000;

    /**
     * 引擎显式初始化：在 Mock 服务启动前调用，一次性完成配置与 CSV 数据加载
     */
    public async init(csvPath = '/mock-data.csv'): Promise<void> {
        const res = await fetch(csvPath);
        if (!res.ok) {
            throw new Error(`[TimeEngine] 配置文件读取失败 (${csvPath}): ${res.statusText}`);
        }
        const csvText = await res.text();
        this.parsedData = parseCsvContent(csvText);

        // 配置加载完成后，立即初始化引擎全局状态
        const configWindow = this.parsedData.config['DEFAULT_WINDOW_MS'];
        if (configWindow) {
            this.defaultWindowMs = Number(configWindow);
        }

        const mockTimeScale = Number(this.parsedData.config['MOCK_TIME_SCALE']) ?? 1.0;
        useRefClock.getState().setAnchor(mockTimeScale);

        this.startTime = Date.now();
    }

    public resetTime(): void {
        this.startTime = Date.now();
    }

    public getElapsedMs(): number {
        return Date.now() - this.startTime;
    }

    public getDefaultWindowMs(): number {
        return this.defaultWindowMs;
    }

    public getWindowedRecords(windowMs?: number, customElapsedMs?: number): FrameRecord[] {
        const effectiveWindow = windowMs ?? this.defaultWindowMs;
        const elapsed = customElapsedMs ?? this.getElapsedMs();
        const windowStart = elapsed - effectiveWindow;

        return this.parsedData.records.filter(
            (record) => record.offsetMs >= windowStart && record.offsetMs <= elapsed
        );
    }

    public getFutureRecords(customElapsedMs?: number): FrameRecord[] {
        const elapsed = customElapsedMs ?? this.getElapsedMs();
        return this.parsedData.records.filter((record) => record.offsetMs > elapsed);
    }
}

export const mockDataEngine = new DataEngine();