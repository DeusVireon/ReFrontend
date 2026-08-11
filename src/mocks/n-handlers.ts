import { http, sse, HttpResponse } from 'msw';
import { registeredEvents, type AppSseEvents } from './event-config';
import { mockDataEngine } from './data-engine';

export const handlers = [
    sse<AppSseEvents>('/api/event', async ({ client, request }) => {
        const url = new URL(request.url);
        const windowParam = url.searchParams.get('windowMs');
        const windowMs = windowParam ? Number(windowParam) : mockDataEngine.getDefaultWindowMs();
        const currentElapsed = mockDataEngine.getElapsedMs();

        // 推送历史窗口数据
        mockDataEngine
            .getWindowedRecords(windowMs, currentElapsed)
            .forEach((record) => {
                registeredEvents.forEach((sseEvent) => sseEvent.emit(client, record.cells));
            });

        // 游标 + 单定时器链式调度
        const futureRecords = mockDataEngine.getFutureRecords(currentElapsed);
        let timerId: number | null = null;
        let cursor = 0; // 当前待处理的数据游标

        function scheduleNext() {
            const nowElapsed = mockDataEngine.getElapsedMs();

            // 消费所有“已到期”的数据帧
            while (cursor < futureRecords.length) {
                const currentRecord = futureRecords[cursor];

                // 非空校验 + 时间未到判断：完美收窄类型并优雅中断循环
                if (!currentRecord || currentRecord.offsetMs > nowElapsed) {
                    break;
                }

                registeredEvents.forEach((sseEvent) => sseEvent.emit(client, currentRecord.cells));
                cursor++;
            }

            // 获取下一条即将到期的记录
            const nextRecord = futureRecords[cursor];

            // 类型收窄：只有当 nextRecord 确实存在时，才安排下一次 Timer
            if (nextRecord) {
                const delay = Math.max(0, nextRecord.offsetMs - mockDataEngine.getElapsedMs());
                timerId = window.setTimeout(scheduleNext, delay);
            }
        }

        // 启动推流调度链
        scheduleNext();

        // 连接断开清理：无论数据量多大，只需清理 1 个定时器
        request.signal.addEventListener('abort', () => {
            if (timerId !== null) {
                window.clearTimeout(timerId);
            }
        });
    }),
];