import { useState, useEffect } from 'react';

/**
 * 自定义 Hook：处理 HTTP 请求
 * @param {string} url 请求地址
 * @returns {{ data: any, loading: boolean, error: string | null }}
 */
export function useFetch(url: string) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // 1. 如果没有传 URL，不进行请求
        if (!url) return;

        // 2. 利用 AbortController 处理竞态条件（比如上一次请求还没完成，URL 又变了）
        const controller = new AbortController();

        // 3. 开始新请求前，重置状态
        setLoading(true);
        setError(null);

        fetch(url, { signal: controller.signal })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP 状态码异常: ${res.status}`);
                }
                return res.json();
            })
            .then((responseData) => {
                setData(responseData);
                setLoading(false);
            })
            .catch((err) => {
                // 如果是因为我们主动取消请求引发的错误，不当作异常处理
                if (err.name !== 'AbortError') {
                    setError(err.message || '网络请求失败');
                    setLoading(false);
                }
            });

        // 4. 清理函数：当 url 发生改变或组件卸载时，自动取消上一次未完成的请求
        return () => {
            controller.abort();
        };
    }, [url]); // 当 url 改变时重新运行 effect

    // 5. 返回 UI 渲染所需要的数据和状态
    return { data, loading, error };
}