
export interface SensorInfo {
    id: string
    status: number
    attrKey: string
    lastUpdated: string
    value: string
}

export interface SensorByID {
    sensors: SensorInfo[]
}

export function createMockSensorPayload(): SensorByID {
    // 1. 随机生成传感器数量
    const count = Math.floor(Math.random() * 10) + 2;

    // 2. 生成 1~22 的唯一 ID 池并打乱
    const availableIds = Array.from({ length: 22 }, (_, i) => (i + 1).toString());
    for (let i = availableIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableIds[i], availableIds[j]] = [availableIds[j], availableIds[i]];
    }
    const selectedIds = availableIds.slice(0, count);

    // 属性列表池，用于多传感器场景
    const attrPool = [
        { attrKey: 'temperature', getValue: () => (24.0 + Math.random() * 2).toFixed(1) },
        { attrKey: 'humidity', getValue: () => (50 + Math.floor(Math.random() * 10)).toString() },
        { attrKey: 'pressure', getValue: () => (1013 + Math.floor(Math.random() * 20)).toString() },
        { attrKey: 'co2', getValue: () => (400 + Math.floor(Math.random() * 100)).toString() },
    ];

    const sensors = selectedIds.map((id) => {
        // 3. 概率分布计算：20% 为 0，10% 为 -1，70% 为 1
        const rand = Math.random();
        let status = 1;
        if (rand < 0.20) {
            status = 0;
        } else if (rand < 0.30) {
            status = -1;
        }

        // 4. 随机选取传感器属性与对应模拟值
        const attr = attrPool[Math.floor(Math.random() * attrPool.length)];

        return {
            id,
            status,
            attrKey: attr.attrKey,
            lastUpdated: new Date().toISOString(),
            value: attr.getValue(),
        };
    });

    return { sensors };
}

export interface SystemStatus {
    BackendStatus: number;
    HistoryAnalyzerStatus: number;
    PredictorStatus: number;
    BackendText: string;
    HistoryAnalyzerText: string;
    PredictorText: string;
}

export function createMockSystemStatusPayload(): SystemStatus {
    const normalTexts = [
        '服务运行正常', // 12字
        '系统响应正常', // 13字
        '组件工作正常', // 13字
    ];

    const abnormalTexts = [
        '组件响应超时', // 13字
        '服务异常失败', // 14字
        '连接建立失败', // 14字
    ];

    // 辅助函数：随机获取数组中的一个元素
    const getRandomText = (texts: string[]) => texts[Math.floor(Math.random() * texts.length)];

    // 辅助函数：生成单个组件的状态与文本
    const generateComponentStatus = () => {
        // 1. 10% 概率判定为异常
        const isAbnormal = Math.random() < 0.10;

        // 2. 异常下随机选 0 或 -1，否则固定为 1
        let status = 1;
        if (isAbnormal) {
            status = Math.random() < 0.5 ? 0 : -1;
        }

        // 3. 根据状态选取对应的说明文本
        const text = status === 1 ? getRandomText(normalTexts) : getRandomText(abnormalTexts);

        return { status, text };
    };

    const backend = generateComponentStatus();
    const historyAnalyzer = generateComponentStatus();
    const predictor = generateComponentStatus();

    return {
        BackendStatus: backend.status,
        HistoryAnalyzerStatus: historyAnalyzer.status,
        PredictorStatus: predictor.status,
        BackendText: backend.text,
        HistoryAnalyzerText: historyAnalyzer.text,
        PredictorText: predictor.text,
    };
}

export interface AlertData {
    id: number;
    title: string;
    content: string;
    level: number;
    triggerTime: string;
}

// 常量池
const ALERT_TITLES = ['设备运行状态异常告警'];
const ALERT_CONTENTS = ['检测到系统指标超出预警阈值，请尽快排查原因并处理。'];

// 全局递增 ID 计数器
let currentAlertId = 1;

export function createMockAlertDataPayload(): AlertData {
    // 1. id 递增
    const id = currentAlertId++;

    // 2. 概率分布计算：60% 为 1，30% 为 2，10% 为 3
    const rand = Math.random();
    let level = 1;
    if (rand < 0.60) {
        level = 1;
    } else if (rand < 0.90) { // 0.60 + 0.30
        level = 2;
    } else {
        level = 3;
    }

    return {
        id,
        title: ALERT_TITLES[0],
        content: ALERT_CONTENTS[0],
        level,
        triggerTime: new Date().toISOString(),
    };
}

/**
 * 辅助函数：重置 ID 计数器（适用于单元测试或重置 Mock 状态）
 */
export function resetAlertIdCounter(startId: number = 1) {
    currentAlertId = startId;
}

export interface LogData {
    id: number;
    name: string;
    content: string;
    level: number;
    triggerTime: string;
}

// 常量池
const LOG_NAMES = ['系统', '推理', '回溯分析', '数据库'];
const LOG_CONTENTS = ['执行完成'];

// 全局递增 ID 计数器
let currentLogId = 1;

export function createMockLogDataPayload(): LogData {
    // 1. id 递增
    const id = currentLogId++;

    // 2. 随机选取名称
    const name = LOG_NAMES[Math.floor(Math.random() * LOG_NAMES.length)];

    // 3. 概率分布计算：60% 为 1，30% 为 2，10% 为 3
    const rand = Math.random();
    let level = 1;
    if (rand < 0.60) {
        level = 1;
    } else if (rand < 0.90) { // 0.60 + 0.30
        level = 2;
    } else {
        level = 3;
    }

    return {
        id,
        name,
        content: LOG_CONTENTS[0],
        level,
        triggerTime: new Date().toISOString(),
    };
}

/**
 * 辅助函数：重置 ID 计数器（适用于单元测试或重置 Mock 状态）
 */
export function resetLogIdCounter(startId: number = 1) {
    currentLogId = startId;
}