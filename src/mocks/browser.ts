// src/mocks/browser.ts
import { setupWorker } from 'msw/browser'
import { handlers } from './n-handlers'
import { mockDataEngine } from './data-engine'

export const worker = setupWorker(...handlers)

export async function startMockWorker() {
    // 先加载并配置全局 Mock 状态，再开启网络拦截
    await mockDataEngine.init();
    return worker.start();
}