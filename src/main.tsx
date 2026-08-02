import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'

const root = document.getElementById("root")

if (!root) {
    throw new Error("Root Element Missing")
}

async function enableMocking() {
    if (import.meta.env.MODE !== 'development') {
        return
    }

    const { worker } = await import('./mocks/browser')

    // `worker.start()` returns a Promise that resolves
    // once the Service Worker is up and ready to intercept requests.
    return worker.start()
}

enableMocking().then(() => {
    createRoot(root).render(
        <StrictMode>
            <App />
        </StrictMode>
    )
})