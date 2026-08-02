export type RTEventHandler<T = any> = (payload: T) => void;

class RTEventMgr {
    private eventSource: EventSource | null = null;
    private readonly url: string;

    private routes: Map<string, Set<RTEventHandler>> = new Map();

    constructor(url: string) {
        this.url = url;
    }

    public handle<T = any>(eventType: string, handler: RTEventHandler<T>): () => void {
        if (!this.routes.has(eventType)) {
            this.routes.set(eventType, new Set());
            this.bindRTEvent(eventType);
        }

        this.routes.get(eventType)!.add(handler as RTEventHandler);

        // 取消注册 (Unregister)
        return () => {
            const handlers = this.routes.get(eventType);
            if (handlers) {
                handlers.delete(handler as RTEventHandler);
                if (handlers.size === 0) {
                    this.routes.delete(eventType);
                }
            }
        };
    }

    public connect(): void {
        if (this.eventSource) return;
        this.eventSource = new EventSource(this.url);

        // 绑定当前已注册的所有路由
        for (const eventType of this.routes.keys()) {
            this.bindRTEvent(eventType);
        }

        // 模式 A：如果是标准 SSE (通过 event: xxx 划分)
        // 模式 B：如果是统一 message 管道，以 JSON 信封格式推送：{ "type": "xxx", "payload": { ... } }
        this.eventSource.onmessage = (e) => {
            this.dispatchEnvelope(e.data);
        };
    }

    /**
     * 绑定底层 EventSource 的特定事件
     */
    private bindRTEvent(eventType: string): void {
        if (!this.eventSource) return;

        this.eventSource.addEventListener(eventType, (e: MessageEvent) => {
            this.dispatch(eventType, e.data);
        });
    }

    /**
     * 路由分发器 (Dispatcher)
     */
    private dispatch(eventType: string, rawData: string): void {
        const handlers = this.routes.get(eventType);
        if (!handlers || handlers.size === 0) return;

        try {
            // 像 Go 语言一样，在路由层统一完成解包（Unmarshal）
            const jsonObject = JSON.parse(rawData);
            handlers.forEach((handler) => handler(jsonObject));
        } catch (err) {
            console.error(`[SSERouter] 无法解析路由 [${eventType}] 的数据包:`, err);
        }
    }

    /**
     * 处理 JSON 信封模式 (Single Channel Envelope Pattern)
     */
    private dispatchEnvelope(rawData: string): void {
        try {
            const envelope = JSON.parse(rawData); // { type: 'xxx', payload: { ... } }
            if (envelope && typeof envelope.type === 'string') {
                this.dispatch(envelope.type, JSON.stringify(envelope.payload ?? {}));
            }
        } catch {
            // 忽略无法解析的通用消息
        }
    }

    public disconnect(): void {
        this.eventSource?.close();
        this.eventSource = null;
        this.routes.clear();
    }
}

export const RTEventMgrInst = new RTEventMgr('/api/event');
RTEventMgrInst.connect();