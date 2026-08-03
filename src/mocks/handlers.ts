// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import {
    createMockSensorPayload, createMockSystemStatusPayload,
    createMockAlertDataPayload
} from './rt-events'
import { sse } from 'msw'

type SSEEventMap = {
    'sensor.update': string
    'system.status': string
    'alert.data': string
}

export const handlers = [
    sse<SSEEventMap>('/api/event', ({ client, request }) => {

        client.send({
            event: 'alert.data',
            data: JSON.stringify(createMockAlertDataPayload()),
        })

        const intervalId = setInterval(() => {
            client.send({
                event: 'sensor.update',
                data: JSON.stringify(createMockSensorPayload()),
            })
        }, 2000)

        const systemStatusIntervalId = setInterval(() => {
            client.send({
                event: 'system.status',
                data: JSON.stringify(createMockSystemStatusPayload()),
            })
        }, 10000)

        const alertDataIntervalId = setInterval(() => {
            client.send({
                event: 'alert.data',
                data: JSON.stringify(createMockAlertDataPayload()),
            })
        }, 60000)

        request.signal.addEventListener('abort', () => {
            clearInterval(intervalId)
            clearInterval(systemStatusIntervalId)
            clearInterval(alertDataIntervalId)
        })
    }),
]