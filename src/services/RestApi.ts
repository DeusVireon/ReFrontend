/**
 * 全局 REST JSON 解析器
 * 在路由层统一完成解包，向 handler 传入已解析的 payload，
 * 避免在每个组件内重复做 JSON.parse / 错误处理。
 */
export type RestApiHandler<T = unknown> = (payload: T) => void

export type RestApiResult =
    | { ok: true }
    | { ok: false; error: string }

class RestApiClient {
    public async get<T>(url: string, handler: RestApiHandler<T>): Promise<RestApiResult> {
        try {
            const response = await fetch(url)

            if (!response.ok) {
                const message = `[RestApi] ${url} 响应异常: ${response.status}`
                console.error(message)
                return { ok: false, error: message }
            }

            const raw = await response.text()
            let jsonObject: T

            try {
                jsonObject = JSON.parse(raw) as T
            } catch (err) {
                const message = `[RestApi] 无法解析 ${url} 的 JSON 数据包`
                console.error(message, err)
                return { ok: false, error: message }
            }

            handler(jsonObject)
            return { ok: true }
        } catch (err) {
            const message = `[RestApi] 请求失败: ${url}`
            console.error(message, err)
            return { ok: false, error: message }
        }
    }
}

export const RestApiInst = new RestApiClient()
