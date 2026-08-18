export type DeviceConnectionMode = "active" | "passive"

export type DeviceConnectionStatus = "online" | "warning" | "offline"

export interface DeviceRecord {
    id: string
    displayName: string
    description: string
    primaryAttrKey: string
    mappedAttrCount: number
    mode: DeviceConnectionMode
    endpoint: string
    status: DeviceConnectionStatus
    lastSeen: string
}

export interface DeviceDraft {
    displayName: string
    primaryAttrKey: string
    description: string
    mode: DeviceConnectionMode
    ip: string
    port: string
    requestInterval: string
    requestTimeout: string
    retryCount: string
    routePath: string
    publishInterval: string
    maxReceiveGap: string
}

export interface ParsedSensorValue {
    attrKey: string
    value: number
    unit: string
    timestamp: string
}

export const ATTR_KEY_OPTIONS = [
    { value: "rto_in_conc", label: "RTO 入口浓度" },
    { value: "rto_in_flow", label: "RTO 入口流量" },
    { value: "rto_in_temp", label: "RTO 入口温度" },
    { value: "rto_in_pressure", label: "RTO 入口压力" },
    { value: "combustion_temp", label: "燃烧室温度" },
    { value: "rto_out_conc", label: "RTO 出口浓度" },
    { value: "rto_out_temp", label: "RTO 出口温度" },
    { value: "rotor_speed", label: "转轮转速" },
] as const

export const INITIAL_DEVICE_DRAFT: DeviceDraft = {
    displayName: "RTO 入口三合一监测仪",
    primaryAttrKey: "rto_in_conc",
    description: "采集 RTO 入口浓度、流量与温度，用于预测模型输入。",
    mode: "active",
    ip: "192.168.10.46",
    port: "8080",
    requestInterval: "15",
    requestTimeout: "3",
    retryCount: "3",
    routePath: "/sensor/upload/rto-inlet-02",
    publishInterval: "15",
    maxReceiveGap: "45",
}

export const INITIAL_DEVICES: DeviceRecord[] = [
    {
        id: "DEV-001",
        displayName: "厂界气象站",
        description: "园区环境温湿度与气压",
        primaryAttrKey: "ambient_temp",
        mappedAttrCount: 3,
        mode: "passive",
        endpoint: "/sensor/upload/weather-01",
        status: "online",
        lastSeen: "12 秒前",
    },
    {
        id: "DEV-008",
        displayName: "沸石转轮控制器",
        description: "转速与吸附/脱附风机状态",
        primaryAttrKey: "rotor_speed",
        mappedAttrCount: 3,
        mode: "active",
        endpoint: "192.168.10.31:8080",
        status: "online",
        lastSeen: "8 秒前",
    },
    {
        id: "DEV-015",
        displayName: "浓缩废气分析仪",
        description: "浓缩段浓度、温度和流量",
        primaryAttrKey: "concentrated_conc",
        mappedAttrCount: 4,
        mode: "active",
        endpoint: "192.168.10.39:8080",
        status: "warning",
        lastSeen: "2 分钟前",
    },
    {
        id: "DEV-019",
        displayName: "RTO 入口在线监测仪",
        description: "RTO 入口工况综合采集",
        primaryAttrKey: "rto_in_conc",
        mappedAttrCount: 4,
        mode: "passive",
        endpoint: "/sensor/upload/rto-inlet-01",
        status: "online",
        lastSeen: "16 秒前",
    },
    {
        id: "DEV-025",
        displayName: "RTO 排口 VOCs 分析仪",
        description: "出口浓度和烟气温度",
        primaryAttrKey: "rto_out_conc",
        mappedAttrCount: 2,
        mode: "passive",
        endpoint: "/sensor/upload/rto-outlet-01",
        status: "online",
        lastSeen: "5 秒前",
    },
]

export const SAMPLE_RAW_DATA = JSON.stringify({
    device_sn: "RTO-INLET-02",
    protocol_version: "2.1",
    history: [
        {
            timestamp: "2026-08-18T12:30:00Z",
            rto_in_conc: 418.7,
            rto_in_flow: 1002.3,
            rto_in_temp: 365,
        },
        {
            timestamp: "2026-08-18T12:30:15Z",
            rto_in_conc: 421.2,
            rto_in_flow: 1004.8,
            rto_in_temp: 365.9,
        },
    ],
}, null, 2)

export const SAMPLE_TEST_DATA = JSON.stringify({
    device_sn: "RTO-INLET-02",
    protocol_version: "2.1",
    history: [
        {
            timestamp: "2026-08-18T12:31:00Z",
            rto_in_conc: 423.6,
            rto_in_flow: 1005.15,
            rto_in_temp: 366.8,
        },
    ],
}, null, 2)

export const SAMPLE_MAPPING_CONFIG = {
    rto_in_conc: {
        time_from: "history.#.timestamp",
        time_format: "2006-01-02T15:04:05Z",
        time_scaler: 1.0,
        time_offset: 0.0,
        value_from: "history.#.rto_in_conc",
        value_scaler: 1.0,
        value_offset: 0.0,
    },
    rto_in_flow: {
        time_from: "history.#.timestamp",
        time_format: "2006-01-02T15:04:05Z",
        time_scaler: 1.0,
        time_offset: 0.0,
        value_from: "history.#.rto_in_flow",
        value_scaler: 1.0,
        value_offset: 0.05,
    },
    rto_in_temp: {
        time_from: "history.#.timestamp",
        time_format: "2006-01-02T15:04:05Z",
        time_scaler: 1.0,
        time_offset: 0.0,
        value_from: "history.#.rto_in_temp",
        value_scaler: 0.5555556,
        value_offset: -17.7777778,
    },
}

export const SAMPLE_MAPPING_TEXT = JSON.stringify(SAMPLE_MAPPING_CONFIG, null, 2)

export const SAMPLE_PARSED_VALUES: ParsedSensorValue[] = [
    {
        attrKey: "rto_in_conc",
        value: 423.6,
        unit: "mg/m³",
        timestamp: "2026-08-18 20:31:00",
    },
    {
        attrKey: "rto_in_flow",
        value: 1005.2,
        unit: "m³/h",
        timestamp: "2026-08-18 20:31:00",
    },
    {
        attrKey: "rto_in_temp",
        value: 186.0,
        unit: "℃",
        timestamp: "2026-08-18 20:31:00",
    },
]

export function createDeviceRecord(draft: DeviceDraft, ordinal: number): DeviceRecord {
    const endpoint = draft.mode === "active"
        ? `${draft.ip}:${draft.port}`
        : draft.routePath

    return {
        id: `DEV-${String(ordinal).padStart(3, "0")}`,
        displayName: draft.displayName,
        description: draft.description || "未填写设备说明",
        primaryAttrKey: draft.primaryAttrKey,
        mappedAttrCount: Object.keys(SAMPLE_MAPPING_CONFIG).length,
        mode: draft.mode,
        endpoint,
        status: "online",
        lastSeen: "刚刚",
    }
}
