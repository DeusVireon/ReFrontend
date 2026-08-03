// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import { createMockSensorPayload, createMockSystemStatusPayload } from './rt-events'
import { sse } from 'msw'

type SSEEventMap = {
    'sensor.update': string
    'system.status': string
}

export const handlers = [
    sse<SSEEventMap>('/api/event', ({ client, request }) => {
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

        request.signal.addEventListener('abort', () => {
            clearInterval(intervalId)
            clearInterval(systemStatusIntervalId)
        })
    }),
]