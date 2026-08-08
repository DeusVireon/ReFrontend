// src/mocks/browser.ts
import { setupWorker } from 'msw/browser'
import { handlers } from './n-handlers'

export const worker = setupWorker(...handlers)