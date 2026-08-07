
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

    const getRandom = (base: number, variance: number, precision = 1) => {
        const val = base + (Math.random() * 2 - 1) * variance;
        return Number(val.toFixed(precision));
    };

    // 属性列表池，用于多传感器场景
    const attrPool = [
        // 1. 环境与涂布进气参数
        { attrKey: 'ambient_temp', getValue: () => getRandom(21.5, 1.5, 1) },
        { attrKey: 'ambient_humidity', getValue: () => getRandom(65.3, 5.0, 1) },
        { attrKey: 'ambient_pressure', getValue: () => getRandom(101.3, 0.5, 1) },
        { attrKey: 'coating_flow', getValue: () => getRandom(8500.5, 250.0, 1) },
        { attrKey: 'coating_conc', getValue: () => getRandom(95.2, 8.0, 1) },
        { attrKey: 'coating_temp', getValue: () => getRandom(25.3, 1.2, 1) },
        { attrKey: 'coating_pressure', getValue: () => getRandom(101.2, 0.4, 1) },

        // 2. 沸石转轮与吸脱附参数
        { attrKey: 'rotor_speed', getValue: () => getRandom(4.75, 0.15, 2) },
        { attrKey: 'adsorption_fan_power', getValue: () => getRandom(42.5, 2.0, 1) },
        { attrKey: 'desorption_fan_power', getValue: () => getRandom(3.2, 0.3, 1) },
        { attrKey: 'rotor_inlet_temp', getValue: () => getRandom(26.1, 1.2, 1) },
        { attrKey: 'rotor_inlet_humid', getValue: () => getRandom(64.8, 4.0, 1) },
        { attrKey: 'desorption_temp', getValue: () => getRandom(205.3, 4.0, 1) },

        // 3. 浓缩风与 RTO 进气参数
        { attrKey: 'concentrated_flow', getValue: () => getRandom(850.2, 30.0, 1) },
        { attrKey: 'concentrated_conc', getValue: () => getRandom(420.5, 25.0, 1) },
        { attrKey: 'concentrated_temp', getValue: () => getRandom(185.2, 5.0, 1) },
        { attrKey: 'concentrated_pressure', getValue: () => getRandom(101.5, 0.5, 1) },
        { attrKey: 'rto_in_flow', getValue: () => getRandom(1000.3, 35.0, 1) },
        { attrKey: 'rto_in_conc', getValue: () => getRandom(415.2, 20.0, 1) },
        { attrKey: 'rto_in_temp', getValue: () => getRandom(185.1, 5.0, 1) },
        { attrKey: 'rto_in_pressure', getValue: () => getRandom(101.4, 0.5, 1) },

        // 4. RTO 燃烧与排放端参数
        { attrKey: 'burner_gas_flow', getValue: () => getRandom(32.5, 2.0, 1) },
        { attrKey: 'combustion_temp', getValue: () => getRandom(757.8, 8.0, 1) },
        { attrKey: 'rto_out_conc', getValue: () => getRandom(18.5, 3.0, 1) },
        { attrKey: 'rto_out_temp', getValue: () => getRandom(62.3, 2.5, 1) },
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
const LOG_CONTENTS = [
    '执行完成',
    '数据更新成功',
    '推理结果已生成',
    '回溯分析完成',
    '数据库连接已建立',
    '系统状态正常',];

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
        content: LOG_CONTENTS[Math.floor(Math.random() * LOG_CONTENTS.length)],
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

export interface OverallStatus {
    sysStatus: number;
    sysPrompt: string;
    bizStatus: number;
    bizPrompt: string;
}

// 系统提示语常量池（按状态 -1, 0, 1 映射）
const SYS_PROMPT_POOL: Record<number, string[]> = {
    1: [
        '',
    ],
    0: [
        '服务响应迟缓',
    ],
    '-1': [
        '服务连接中断',
        '推理服务异常',
    ],
};

// 业务提示语常量池（按状态 -1, 0, 1 映射）
const BIZ_PROMPT_POOL: Record<number, string[]> = {
    1: [
        '',
    ],
    0: [
        '回溯推理提示异常',
        '预测推理提示超标',
    ],
    '-1': [
        '多个传感器未响应',
        '预测推理提示严重超标',
    ],
};

// 辅助函数：根据状态从对应的常量池中随机选取一条提示语
const getRandomPrompt = (pool: Record<number, string[]>, status: number): string => {
    const list = pool[status] || pool[1];
    return list[Math.floor(Math.random() * list.length)];
};

// 辅助函数：生成 -1 / 0 / 1 概率状态（按 70% 正常(1)、20% 警告(0)、10% 异常(-1)）
const generateStatus = (): number => {
    const rand = Math.random();
    if (rand < 0.70) {
        return 1;
    } else if (rand < 0.90) { // 0.70 + 0.20
        return 0;
    } else {
        return -1;
    }
};

export function createMockOverallStatusPayload(): OverallStatus {
    const sysStatus = generateStatus();
    const bizStatus = generateStatus();

    return {
        sysStatus,
        sysPrompt: getRandomPrompt(SYS_PROMPT_POOL, sysStatus),
        bizStatus,
        bizPrompt: getRandomPrompt(BIZ_PROMPT_POOL, bizStatus),
    };
}