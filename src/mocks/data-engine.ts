import { parseCsvContent } from './script-reader';
import { type FrameRecord, type ParsedCsvResult } from './types';

export class TimeEngine {
    private startTime: number = Date.now();
    private parsedData: ParsedCsvResult | null = null;
    private loadingPromise: Promise<ParsedCsvResult> | null = null;

    // 在浏览器中异步读取 public 目录下的 CSV 文件
    public async ensureLoaded(csvPath = '/mockData.csv'): Promise<ParsedCsvResult> {
        if (this.parsedData) {
            return this.parsedData;
        }

        if (!this.loadingPromise) {
            this.loadingPromise = fetch(csvPath)
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`无法读取 Mock 配置文件 (${csvPath}): ${res.statusText}`);
                    }
                    return res.text();
                })
                .then((csvText) => {
                    this.parsedData = parseCsvContent(csvText);
                    return this.parsedData;
                })
                .catch((err) => {
                    this.loadingPromise = null;
                    throw err;
                });
        }

        return this.loadingPromise;
    }

    public resetTime(): void {
        this.startTime = Date.now();
    }

    public getElapsedMs(): number {
        return Date.now() - this.startTime;
    }

    public getConfig(key: string): string | undefined {
        return this.parsedData?.config[key];
    }

    public getWindowedRecords(windowMs: number, customElapsedMs?: number): FrameRecord[] {
        if (!this.parsedData) {
            return [];
        }
        const elapsed = customElapsedMs ?? this.getElapsedMs();
        const windowStart = elapsed - windowMs;

        return this.parsedData.records.filter(
            (record) => record.offsetMs >= windowStart && record.offsetMs <= elapsed
        );
    }

    public getFutureRecords(customElapsedMs?: number): FrameRecord[] {
        if (!this.parsedData) {
            return [];
        }
        const elapsed = customElapsedMs ?? this.getElapsedMs();
        return this.parsedData.records.filter((record) => record.offsetMs > elapsed);
    }
}