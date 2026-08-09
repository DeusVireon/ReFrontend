// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

async function enableMocking() {
    if (import.meta.env.MODE !== 'development') {
        return;
    }

    const { worker } = await import('./mocks/browser');

    return worker.start({
        onUnhandledRequest: 'bypass',
        quiet: false,
    });
}

enableMocking().then(async () => {
    // 在 MSW 完全就绪后，再动态加载 App
    const { default: App } = await import('./app');

    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
});