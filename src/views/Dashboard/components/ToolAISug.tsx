import { useEffect, useRef, useState } from "react"
import { ArrowUpIcon, Bot, CircleOff, Info, SquareArrowOutDownLeft } from "lucide-react"
import { useSound } from "use-sound"

import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAISugMessage } from "../stores/AISugMessage"
import { useAlertData } from "../stores/AlertData"
import { usePredictResult } from "../stores/PredictResult"
import { useSensorData } from "../stores/SensorData"

const QUICK_QUESTIONS = [
    "查询 RTO 出口浓度历史",
    "查看最近一次预测预警",
    "哪些参数先发生变化？",
]

export function ToolAISug() {
    const [isExpanded, setExpanded] = useState(false)
    const setAISugTip = useAISugMessage((state) => state.setShowTip)

    return (
        <div className="relative rounded-md text-text">
            {isExpanded && <ToolAISubChat onChatClose={() => setExpanded(false)} />}
            {!isExpanded && (
                <ToolAISugBtn onClick={() => {
                    setExpanded(true)
                    setAISugTip("")
                }} />
            )}
        </div>
    )
}

function ToolAISugBtn({ onClick }: { onClick: () => void }) {
    const [messageArrive] = useSound("/sounds/AIMessage.mp3")
    const previousIndicator = useRef(0)
    const indicator = useAISugMessage((state) => state.indicator)
    const showTip = useAISugMessage((state) => state.showTip)

    useEffect(() => {
        if (indicator !== previousIndicator.current && indicator !== 0) {
            messageArrive()
        }
        previousIndicator.current = indicator
    }, [indicator, messageArrive])

    return (
        <div className="relative flex flex-row items-center">
            <Button
                variant="ghost"
                className="relative size-12 rounded-md bg-theme-2/50"
                aria-label="打开 VOCs 研判助手"
                onClick={onClick}
            >
                <Bot className="size-lg" />
                {indicator === 1 && <span className="absolute ml-7 mb-7 size-2.5 animate-ping rounded-full bg-accent opacity-75" />}
                {indicator === 1 && <span className="absolute ml-7 mb-7 size-2.5 rounded-full bg-accent" />}
            </Button>
            {showTip && (
                <div className="flex items-center animate-expand-right">
                    <div
                        className="-left-3 top-1/2 h-6 w-3 translate-x-px bg-theme-2/75"
                        style={{ clipPath: "polygon(0% 50%, 100% 0%, 100% 100%)" }}
                    />
                    <div className="flex rounded-md bg-theme-2/75 px-2 py-1.5 animate-pulse-brightness">
                        <Info className="mr-1 p-0.5" />
                        {showTip}
                    </div>
                </div>
            )}
        </div>
    )
}

function MessageBubble({ id }: { id: number }) {
    const message = useAISugMessage((state) => state.messageByID[id])

    if (!message) return null

    return (
        <Bubble
            variant={message.type === "user" ? "default" : "outline"}
            align={message.type === "user" ? "end" : "start"}
            className={message.type === "assistant" ? "animate-flash-highlight" : undefined}
        >
            <BubbleContent>{message.content}</BubbleContent>
        </Bubble>
    )
}

function ToolAISubChat({ onChatClose }: { onChatClose?: () => void }) {
    const messages = useAISugMessage((state) => state.idList)
    const [input, setInput] = useState("")
    const [isReplying, setReplying] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, [messages, isReplying])

    const sendMsg = (question = input) => {
        const normalizedQuestion = question.trim()
        if (!normalizedQuestion || isReplying) return

        const saveMsg = useAISugMessage.getState().setMessage
        const userMessageId = Date.now()
        saveMsg({
            id: userMessageId,
            type: "user",
            content: normalizedQuestion,
            timestamp: new Date().toISOString(),
        })
        setInput("")
        setReplying(true)

        window.setTimeout(() => {
            saveMsg({
                id: userMessageId + 1,
                type: "assistant",
                content: buildDemoReply(normalizedQuestion),
                timestamp: new Date().toISOString(),
            })
            setReplying(false)
        }, 360)
    }

    return (
        <div className="flex h-fit w-96 flex-col overflow-hidden rounded-md bg-theme-2/90 shadow-2xl backdrop-blur-md">
            <div className="flex items-center border-b border-theme-1/40 px-4 py-2 text-lg font-bold">
                <Bot className="mr-2" />
                <div>
                    <div>VOCs 研判助手</div>
                    <div className="text-[11px] font-normal opacity-65">演示模式 · 本地固定回复</div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    aria-label="关闭研判助手"
                    onClick={onChatClose}
                >
                    <SquareArrowOutDownLeft />
                </Button>
            </div>

            <div className="flex max-h-[50vh] min-h-52 flex-col gap-3 overflow-auto p-4">
                {messages.map((item) => <MessageBubble key={item} id={item} />)}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-sm opacity-60">
                        <CircleOff className="mb-2" />
                        <div>暂无对话记录</div>
                        <div>可查询模拟历史数据和预测预警</div>
                    </div>
                )}
                {isReplying && <div className="text-xs opacity-60">正在整理当前模拟数据...</div>}
                <div ref={bottomRef} />
            </div>

            <div className="flex flex-wrap gap-1.5 border-t border-theme-1/25 px-3 pt-2">
                {QUICK_QUESTIONS.map((question) => (
                    <Button
                        key={question}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 bg-theme-1/15 text-xs"
                        disabled={isReplying}
                        onClick={() => sendMsg(question)}
                    >
                        {question}
                    </Button>
                ))}
            </div>

            <form
                className="flex w-full items-end gap-2 bg-theme-2/50 p-2"
                onSubmit={(event) => {
                    event.preventDefault()
                    sendMsg()
                }}
            >
                <Input
                    placeholder="询问历史数值或预测预警"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                />
                <Button type="submit" size="icon" disabled={!input.trim() || isReplying}>
                    <ArrowUpIcon />
                </Button>
            </form>
        </div>
    )
}

function buildDemoReply(question: string) {
    const normalized = question.toLowerCase()

    if (normalized.includes("预警") || normalized.includes("风险") || normalized.includes("超标")) {
        return buildPredictionReply()
    }
    if (normalized.includes("参数") || normalized.includes("原因") || normalized.includes("变化")) {
        return buildProcessReply()
    }
    if (normalized.includes("历史") || normalized.includes("浓度") || normalized.includes("查询")) {
        return buildHistoryReply()
    }

    return "当前为离线演示，可查询：RTO 出口浓度历史、最近一次预测预警，以及预警前先发生变化的工艺参数。"
}

function buildHistoryReply() {
    const history = useSensorData.getState().attrHistory.rto_out_conc?.history ?? []
    const recent = history.slice(-24)
    if (recent.length === 0) {
        return "模拟数据正在加载，暂未收到 RTO 出口浓度记录。"
    }

    const values = recent.map((item) => item.value)
    const latest = values.at(-1) ?? 0
    const first = values[0] ?? latest
    const change = latest - first
    const direction = Math.abs(change) < 0.5 ? "总体平稳" : change > 0 ? "总体上升" : "总体回落"

    return `最近 ${recent.length} 个采样点中，RTO 出口浓度范围为 ${Math.min(...values).toFixed(1)}–${Math.max(...values).toFixed(1)} mg/m3；最新值 ${latest.toFixed(1)} mg/m3，较首个采样点${change >= 0 ? "上升" : "下降"} ${Math.abs(change).toFixed(1)} mg/m3，${direction}。`
}

function buildPredictionReply() {
    const prediction = usePredictResult.getState().predictResult
    if (!prediction || prediction.PredSteps.length === 0) {
        return "模拟预测尚未生成，请等待预测数据更新。"
    }

    const values = prediction.PredSteps.map((step) => step.value)
    const peak = Math.max(...values)
    const firstExceedIndex = prediction.PredSteps.findIndex((step) => step.value > 80)
    const alertState = useAlertData.getState()
    const latestAlertId = alertState.idList[0]
    const latestAlert = latestAlertId ? alertState.alertByID[latestAlertId] : null

    if (firstExceedIndex < 0) {
        return `最新 6 小时预测峰值为 ${peak.toFixed(1)} mg/m3，校准风险为 ${prediction.MaxExceedProb.toFixed(1)}%，当前曲线未越过 80 mg/m3。${latestAlert ? `最近状态：${latestAlert.title}。` : ""}`
    }

    const hoursAhead = ((firstExceedIndex + 1) * 0.25).toFixed(2)
    return `最新 6 小时预测峰值为 ${peak.toFixed(1)} mg/m3，校准风险为 ${prediction.MaxExceedProb.toFixed(1)}%；预计约 ${hoursAhead} 小时后首次越过 80 mg/m3。该内容来自模拟预测数据，不会自动下发控制指令。`
}

function buildProcessReply() {
    const sensorState = useSensorData.getState()
    const inlet = sensorState.attrHistory.rto_in_conc?.latestValue?.value
    const combustion = sensorState.attrHistory.combustion_temp?.latestValue?.value
    const rotor = sensorState.attrHistory.rotor_speed?.latestValue?.value

    if (inlet === undefined || combustion === undefined || rotor === undefined) {
        return "模拟工艺数据尚未加载完整，暂时无法汇总参数变化。"
    }

    return `本次模拟事件中，RTO 入口浓度先升至 ${inlet.toFixed(1)} mg/m3，燃烧室温度同步变化至 ${combustion.toFixed(1)} C，转轮转速为 ${rotor.toFixed(2)} rpm。它们是预警前的观测变化，只表示时间先后和模型关联，不代表已经证明物理因果。`
}
