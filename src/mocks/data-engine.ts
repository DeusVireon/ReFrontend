import { parseCsvContent } from './script-parser';
import { type FrameRecord, type ParsedCsvResult } from './types';
import { useRefClock } from '@/stores/ReferenceClock';

export class DataEngine {
    private startTime: number = Date.now();
    private parsedData: ParsedCsvResult = { config: {}, records: [] };
    private defaultWindowMs: number = 5000;
    private fixedElapsedMs: number | null = null;

    /**
     * 引擎显式初始化：在 Mock 服务启动前调用，一次性完成配置与 CSV 数据加载
     */
    public async init(
        csvPath = '/mock-data.csv',
    ): Promise<void> {
        const res = await fetch(csvPath);
        if (!res.ok) {
            throw new Error(`[TimeEngine] 配置文件读取失败 (${csvPath}): ${res.statusText}`);
        }
        const csvText = await res.text();
        this.parsedData = parseCsvContent(csvText);

        // 用于初始化加载内容，仅供调试
        // const dcaResponse = await fetch(dcaCsvPath);
        // if (dcaResponse.ok) {
        //     const dcaData = parseCsvContent(await dcaResponse.text());
        //     const dcaRecords = dcaData.records.flatMap((record) => {
        //         const payload = record.cells[0];
        //         if (payload === null || payload === undefined) return [];

        //         const cells = Array<CellValue>(COL_INDEX.DCAFrom + 1).fill(null);
        //         cells[COL_INDEX.DCAFrom] = payload;
        //         return [{ offsetMs: record.offsetMs, cells }];
        //     });

        //     this.parsedData.records = [...this.parsedData.records, ...dcaRecords]
        //         .sort((a, b) => a.offsetMs - b.offsetMs);
        // }

        // 配置加载完成后，立即初始化引擎全局状态
        const configWindow = this.parsedData.config['DEFAULT_WINDOW_MS'];
        if (configWindow) {
            this.defaultWindowMs = Number(configWindow);
        }

        const configuredTimeScale = Number(this.parsedData.config['MOCK_TIME_SCALE']);
        const mockTimeScale = Number.isFinite(configuredTimeScale) && configuredTimeScale > 0
            ? configuredTimeScale
            : 1.0;
        useRefClock.getState().setAnchor(mockTimeScale);

        const searchParams = new URLSearchParams(window.location.search);
        this.fixedElapsedMs = searchParams.get('safe-demo') === '1' ? 68_000 : null;

        this.startTime = Date.now();
    }

    public resetTime(): void {
        this.startTime = Date.now();
    }

    public getElapsedMs(): number {
        return this.fixedElapsedMs ?? Date.now() - this.startTime;
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
