import { type CellValue, type FrameRecord, type ParsedCsvResult, type SpecialConfig } from './types';

function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            // RFC 4180 标准：在引号内遇到连续两个双引号 ""，表示字段内部转义的双引号 "
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++; // 跳过下一个双引号
            } else {
                // 切换最外层包围引号的状态（外层引号不追加到 current）
                inQuotes = !inQuotes;
            }
        } else if (char === '\\' && inQuotes && i + 1 < line.length && line[i + 1] === '"') {
            // 兼容支持：处理反斜杠转义的情况 (\" -> ")
            current += '"';
            i++;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function parseCellValue(raw: string): CellValue {
    if (raw === '') {
        return null;
    }
    const lower = raw.toLowerCase();
    if (lower === 'true') {
        return true;
    }
    if (lower === 'false') {
        return false;
    }
    const num = Number(raw);
    if (!isNaN(num)) {
        return num;
    }
    return raw;
}

export function parseCsvContent(content: string): ParsedCsvResult {
    const lines = content.split(/\r?\n/);
    const records: FrameRecord[] = [];
    const config: SpecialConfig = {};

    for (const rawLine of lines) {
        const trimmedLine = rawLine.trim();

        // 跳过空行和注释行
        if (!trimmedLine || trimmedLine.startsWith('//')) {
            continue;
        }

        // 先进行 CSV 列解析，确保按逗号正确拆分单元格
        const cols = parseCsvLine(trimmedLine);
        if (cols.length === 0) {
            continue;
        }

        const firstCell = cols[0]?.trim();

        // 解析特殊配置指令行：单元格 0 为 '*'，单元格 1 为 key，单元格 2 为 value
        if (firstCell === '*') {
            const key = cols[1]?.trim();
            if (key) {
                const val = cols[2]?.trim();
                // 仅提取第 3 个单元格，忽略后续多余的列，当第三单元格为空时降级为 'true'
                config[key] = val && val !== '' ? val : 'true';
            }
            continue;
        }

        // 解析常规数据行
        const offsetMs = Number(firstCell);

        if (!isNaN(offsetMs)) {
            const cells = cols.slice(1).map(parseCellValue);
            records.push({ offsetMs, cells });
        }
    }

    records.sort((a, b) => a.offsetMs - b.offsetMs);
    return { config, records };
}