import { http, sse, HttpResponse } from 'msw';
import { systemStatusEvent, type AppSseEvents } from './event-config';
import { TimeEngine } from './data-engine';

const mockEngine = new TimeEngine();

export const handlers = [
    // SSE 流式推流接口
    sse<AppSseEvents>('/api/event', async ({ client, request }) => {
        console.log('SSE client connected:', request.url);
        await mockEngine.ensureLoaded();

        const url = new URL(request.url);
        const windowParam = url.searchParams.get('windowMs');
        const configWindow = mockEngine.getConfig('DEFAULT_WINDOW_MS');
        const windowMs = windowParam ? Number(windowParam) : Number(configWindow ?? 5000);

        const currentElapsed = mockEngine.getElapsedMs();

        // 推送 T~T-N 滑动窗口内的历史记录
        mockEngine
            .getWindowedRecords(windowMs, currentElapsed)
            .forEach((record) => systemStatusEvent.emit(client, record.cells));

        // 调度未来时间点的数据推流
        const activeTimers = mockEngine.getFutureRecords(currentElapsed).map((record) => {
            const delay = record.offsetMs - currentElapsed;
            return window.setTimeout(() => {
                systemStatusEvent.emit(client, record.cells);
            }, delay);
        });

        // 连接中断清理未执行的定时器
        request.signal.addEventListener('abort', () => {
            activeTimers.forEach((id) => window.clearTimeout(id));
        });
    }),

    // REST API 访问接口
    http.get('/api/system-status/latest', async ({ request }) => {
        await mockEngine.ensureLoaded();

        const url = new URL(request.url);
        const windowMs = Number(url.searchParams.get('windowMs') ?? '5000');

        const validPayloads = mockEngine
            .getWindowedRecords(windowMs)
            .map((record) => systemStatusEvent.parse(record.cells))
            .filter((payload): payload is NonNullable<typeof payload> => payload !== null);

        return HttpResponse.json({
            elapsedMs: mockEngine.getElapsedMs(),
            windowMs,
            data: validPayloads.slice(-1)[0] ?? null,
        });
    }),

    // 重置时间起点
    http.post('/api/mock/reset', () => {
        mockEngine.resetTime();
        return HttpResponse.json({ success: true });
    }),
];