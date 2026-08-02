// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import { createMockSensorPayload } from './real-time-event'
import { sse } from 'msw'

type SSEEventMap = {
    'sensor.update': string
}

export const handlers = [
    sse<SSEEventMap>('/api/event', ({ client, request }) => {
        client.send({
            event: 'sensor.update',
            data: JSON.stringify(createMockSensorPayload()),
        })

        const intervalId = setInterval(() => {
            client.send({
                event: 'sensor.update',
                data: JSON.stringify(createMockSensorPayload()),
            })
        }, 5000)

        request.signal.addEventListener('abort', () => {
            clearInterval(intervalId)
        })
    }),
]