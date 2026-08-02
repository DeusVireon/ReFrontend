
export interface SensorInfo {
    id: number
    status: number
    attrKey: string
    lastUpdated: string
    value: string
}

export interface SensorByID {
    sensors: SensorInfo[]
}

export function createMockSensorPayload(): SensorByID {
    return {
        sensors: [
            {
                id: 101,
                status: 1,
                attrKey: 'temperature',
                lastUpdated: new Date().toISOString(),
                value: (24.0 + Math.random() * 2).toFixed(1),
            },
            {
                id: 102,
                status: 1,
                attrKey: 'humidity',
                lastUpdated: new Date().toISOString(),
                value: (50 + Math.floor(Math.random() * 10)).toString(),
            },
        ],
    }
}