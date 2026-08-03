
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
    // 1. 随机生成传感器数量（1 ~ 22）
    const count = Math.floor(Math.random() * 22) + 1;

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