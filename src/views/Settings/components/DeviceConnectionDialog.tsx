import { useMemo, useState, type ReactNode } from "react"
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    ClipboardPaste,
    Cpu,
    Database,
    Eraser,
    HelpCircle,
    LoaderCircle,
    PlugZap,
    RadioTower,
    Sparkles,
    TestTube2,
    TriangleAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
    ATTR_KEY_OPTIONS,
    INITIAL_DEVICE_DRAFT,
    SAMPLE_MAPPING_TEXT,
    SAMPLE_PARSED_VALUES,
    SAMPLE_RAW_DATA,
    SAMPLE_TEST_DATA,
    type DeviceConnectionMode,
    type DeviceDraft,
    type ParsedSensorValue,
} from "../models/device"

type AsyncStatus = "idle" | "running" | "success" | "error"

const STEP_DEFINITIONS = [
    { title: "基本信息", icon: Database },
    { title: "连接设备", icon: RadioTower },
    { title: "配置解析", icon: Cpu },
    { title: "测试接入", icon: TestTube2 },
] as const

export function DeviceConnectionDialog({
    onComplete,
}: {
    onComplete: (draft: DeviceDraft) => void
}) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(0)
    const [draft, setDraft] = useState<DeviceDraft>(INITIAL_DEVICE_DRAFT)
    const [connectionStatus, setConnectionStatus] = useState<AsyncStatus>("idle")
    const [sampleStatus, setSampleStatus] = useState<AsyncStatus>("idle")
    const [rawData, setRawData] = useState("")
    const [mappingText, setMappingText] = useState("")
    const [aiStatus, setAiStatus] = useState<AsyncStatus>("idle")
    const [aiTokens, setAiTokens] = useState(0)
    const [testStatus, setTestStatus] = useState<AsyncStatus>("idle")
    const [testRawData, setTestRawData] = useState("")
    const [parsedValues, setParsedValues] = useState<ParsedSensorValue[]>([])

    const mappingValidation = useMemo(() => validateMapping(mappingText), [mappingText])
    const canContinue = step === 0
        ? draft.displayName.trim().length > 0 && draft.primaryAttrKey.length > 0
        : step === 1
            ? connectionStatus === "success"
            : step === 2
                ? mappingValidation.valid
                : testStatus === "success" && parsedValues.length > 0

    const reset = () => {
        setStep(0)
        setDraft(INITIAL_DEVICE_DRAFT)
        setConnectionStatus("idle")
        setSampleStatus("idle")
        setRawData("")
        setMappingText("")
        setAiStatus("idle")
        setAiTokens(0)
        setTestStatus("idle")
        setTestRawData("")
        setParsedValues([])
    }

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) reset()
        setOpen(nextOpen)
    }

    const updateDraft = <K extends keyof DeviceDraft>(key: K, value: DeviceDraft[K]) => {
        setDraft((current) => ({ ...current, [key]: value }))
        if (key === "mode") {
            setConnectionStatus("idle")
            setSampleStatus("idle")
            setRawData("")
        }
    }

    const runConnectionTest = async () => {
        setConnectionStatus("running")
        await delay(1400)
        setConnectionStatus("success")
    }

    const requestSample = async () => {
        setSampleStatus("running")
        await delay(draft.mode === "active" ? 1600 : 1100)
        setRawData(SAMPLE_RAW_DATA)
        setSampleStatus("success")
    }

    const runAiParse = async () => {
        if (!rawData || aiStatus === "running") return
        setAiStatus("running")
        setAiTokens(84)
        for (const tokens of [196, 328, 472, 641, 816]) {
            await delay(360)
            setAiTokens(tokens)
        }
        setMappingText(SAMPLE_MAPPING_TEXT)
        setAiTokens(864)
        setAiStatus("success")
    }

    const pasteConfig = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText()
            setMappingText(clipboardText.trim() || SAMPLE_MAPPING_TEXT)
        } catch {
            setMappingText(SAMPLE_MAPPING_TEXT)
        }
        setAiStatus("idle")
    }

    const runAccessTest = async () => {
        setTestStatus("running")
        setParsedValues([])
        setTestRawData("")
        await delay(900)
        setTestRawData(SAMPLE_TEST_DATA)
        await delay(750)
        setParsedValues(SAMPLE_PARSED_VALUES)
        setTestStatus("success")
    }

    const handleNext = () => {
        if (!canContinue) return
        if (step === 3) {
            onComplete(draft)
            setOpen(false)
            return
        }
        const nextStep = step + 1
        setStep(nextStep)
        if (nextStep === 2 && draft.mode === "active" && !rawData) {
            void requestSample()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger render={<Button size="lg" className="bg-accent text-text hover:bg-accent/80" />}>
                <PlugZap />
                接入新设备
            </DialogTrigger>
            <DialogContent className="h-[84vh] w-[calc(100vw-2rem)] max-w-[1180px] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-md border border-theme-4 bg-theme-2/96 p-0 text-text shadow-2xl sm:w-[82vw] sm:max-w-[82vw]">
                <DialogHeader className="border-b border-theme-4 px-5 py-4 pr-14">
                    <DialogTitle className="text-xl font-semibold">接入新设备</DialogTitle>
                    <DialogDescription>
                        建立设备连接，并将原始字段映射为系统标准 attrKey。
                    </DialogDescription>
                </DialogHeader>

                <StepProgress currentStep={step} />

                <div className="min-h-0 overflow-y-auto px-5 py-4">
                    {step === 0 && <BasicInfoStep draft={draft} onChange={updateDraft} />}
                    {step === 1 && (
                        <ConnectionStep
                            draft={draft}
                            status={connectionStatus}
                            onChange={updateDraft}
                            onTest={runConnectionTest}
                        />
                    )}
                    {step === 2 && (
                        <ParserConfigStep
                            mode={draft.mode}
                            sampleStatus={sampleStatus}
                            rawData={rawData}
                            mappingText={mappingText}
                            aiStatus={aiStatus}
                            aiTokens={aiTokens}
                            validation={mappingValidation}
                            onRequestSample={requestSample}
                            onMappingChange={setMappingText}
                            onPaste={pasteConfig}
                            onClear={() => {
                                setMappingText("")
                                setAiStatus("idle")
                            }}
                            onAiParse={runAiParse}
                        />
                    )}
                    {step === 3 && (
                        <AccessTestStep
                            status={testStatus}
                            rawData={testRawData}
                            parsedValues={parsedValues}
                            onTest={runAccessTest}
                        />
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-theme-4 bg-theme-1/35 px-5 py-3">
                    <div className="text-xs text-gray-7">
                        {step === 0 ? "关闭后不会保存当前配置" : `第 ${step + 1} 步，共 4 步`}
                    </div>
                    <div className="flex gap-2">
                        {step === 0 ? (
                            <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
                        ) : (
                            <Button variant="outline" onClick={() => setStep((current) => current - 1)}>
                                <ArrowLeft />
                                上一步
                            </Button>
                        )}
                        <Button
                            disabled={!canContinue}
                            onClick={handleNext}
                            className="min-w-24 bg-accent text-text hover:bg-accent/80"
                        >
                            {step === 3 ? (
                                <><Check />完成</>
                            ) : (
                                <>下一步<ArrowRight /></>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function StepProgress({ currentStep }: { currentStep: number }) {
    return (
        <ol className="grid grid-cols-4 border-b border-theme-4 bg-theme-1/20 px-3 py-3 sm:px-6">
            {STEP_DEFINITIONS.map((definition, index) => {
                const Icon = definition.icon
                const completed = index < currentStep
                const current = index === currentStep
                return (
                    <li key={definition.title} className="relative flex min-w-0 flex-col items-center gap-1 text-center">
                        {index > 0 && (
                            <span className={cn(
                                "absolute right-1/2 top-3.5 h-px w-full -translate-y-1/2",
                                index <= currentStep ? "bg-accent" : "bg-theme-4",
                            )} />
                        )}
                        <span className={cn(
                            "relative z-10 flex size-7 items-center justify-center rounded-full border text-xs",
                            completed && "border-accent bg-accent text-theme-1",
                            current && "border-accent bg-theme-2 text-accent-light ring-2 ring-accent/25",
                            !completed && !current && "border-theme-4 bg-theme-2 text-gray-7",
                        )}>
                            {completed ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                        </span>
                        <span className={cn(
                            "truncate text-[11px] sm:text-xs",
                            current ? "font-semibold text-text" : "text-gray-7",
                        )}>
                            {definition.title}
                        </span>
                    </li>
                )
            })}
        </ol>
    )
}

function BasicInfoStep({
    draft,
    onChange,
}: {
    draft: DeviceDraft
    onChange: <K extends keyof DeviceDraft>(key: K, value: DeviceDraft[K]) => void
}) {
    return (
        <div className="mx-auto max-w-2xl space-y-5">
            <StepHeading
                title="定义设备身份"
                description="设备 ID 由系统生成；attrKey 决定设备数据在监控、分析和预测中的标准语义。"
            />
            <FormField label="设备显示名称" required>
                <Input
                    value={draft.displayName}
                    onChange={(event) => onChange("displayName", event.target.value)}
                    placeholder="例如：RTO 入口在线监测仪"
                />
            </FormField>
            <FormField
                label="主属性 attrKey"
                required
                help="attrKey 是系统内部统一的业务字段名，不是设备序列号。解析配置可继续映射同一设备输出的其他属性。"
            >
                <select
                    value={draft.primaryAttrKey}
                    onChange={(event) => onChange("primaryAttrKey", event.target.value)}
                    className={SELECT_CLASS_NAME}
                >
                    {ATTR_KEY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label} · {option.value}</option>
                    ))}
                </select>
            </FormField>
            <FormField label="设备描述" help="用于运维人员识别安装位置、采集范围或设备用途。">
                <textarea
                    value={draft.description}
                    onChange={(event) => onChange("description", event.target.value)}
                    className={TEXTAREA_CLASS_NAME}
                    rows={4}
                    placeholder="可选"
                />
            </FormField>
        </div>
    )
}

function ConnectionStep({
    draft,
    status,
    onChange,
    onTest,
}: {
    draft: DeviceDraft
    status: AsyncStatus
    onChange: <K extends keyof DeviceDraft>(key: K, value: DeviceDraft[K]) => void
    onTest: () => void
}) {
    return (
        <div className="mx-auto max-w-4xl space-y-5">
            <StepHeading
                title="配置数据连接"
                description="主动采集由平台定时请求设备；被动接收由设备向系统路由持续发布数据。"
            />
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="设备数据获取方式">
                <ModeButton
                    active={draft.mode === "active"}
                    icon={<RadioTower />}
                    title="主动采集"
                    description="平台轮询设备网络地址"
                    onClick={() => onChange("mode", "active")}
                />
                <ModeButton
                    active={draft.mode === "passive"}
                    icon={<PlugZap />}
                    title="被动接收"
                    description="设备推送至系统路由"
                    onClick={() => onChange("mode", "passive")}
                />
            </div>

            {draft.mode === "active" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormField label="设备 IP" required help="设备在生产网络中的 IPv4 地址。">
                        <Input value={draft.ip} onChange={(event) => onChange("ip", event.target.value)} />
                    </FormField>
                    <FormField label="端口" required>
                        <Input type="number" value={draft.port} onChange={(event) => onChange("port", event.target.value)} />
                    </FormField>
                    <FormField label="请求周期" unit="s" help="系统主动拉取数据的时间间隔。">
                        <Input type="number" value={draft.requestInterval} onChange={(event) => onChange("requestInterval", event.target.value)} />
                    </FormField>
                    <FormField label="请求超时" unit="s">
                        <Input type="number" value={draft.requestTimeout} onChange={(event) => onChange("requestTimeout", event.target.value)} />
                    </FormField>
                    <FormField label="断联前重试" unit="次" help="连续失败达到该次数后，设备状态转为离线。">
                        <Input type="number" value={draft.retryCount} onChange={(event) => onChange("retryCount", event.target.value)} />
                    </FormField>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormField label="路由接入点" required help="设备发布数据时使用的系统接入路径。">
                        <Input value={draft.routePath} onChange={(event) => onChange("routePath", event.target.value)} />
                    </FormField>
                    <FormField label="数据发布周期" unit="s">
                        <Input type="number" value={draft.publishInterval} onChange={(event) => onChange("publishInterval", event.target.value)} />
                    </FormField>
                    <FormField label="最大接收间隔" unit="s" help="超过该时间未收到数据时标记连接异常。">
                        <Input type="number" value={draft.maxReceiveGap} onChange={(event) => onChange("maxReceiveGap", event.target.value)} />
                    </FormField>
                </div>
            )}

            <div className="border-t border-theme-4 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="font-medium">连通性测试</div>
                        <div className="text-xs text-gray-7">
                            验证网络、端口或接入路由是否可达，不会写入业务数据。
                        </div>
                    </div>
                    <Button variant="outline" disabled={status === "running"} onClick={onTest}>
                        {status === "running" ? <LoaderCircle className="animate-spin" /> : <PlugZap />}
                        {status === "running" ? "正在建立连接" : "测试连接"}
                    </Button>
                </div>
                <ConnectionFeedback status={status} mode={draft.mode} />
            </div>
        </div>
    )
}

function ParserConfigStep({
    mode,
    sampleStatus,
    rawData,
    mappingText,
    aiStatus,
    aiTokens,
    validation,
    onRequestSample,
    onMappingChange,
    onPaste,
    onClear,
    onAiParse,
}: {
    mode: DeviceConnectionMode
    sampleStatus: AsyncStatus
    rawData: string
    mappingText: string
    aiStatus: AsyncStatus
    aiTokens: number
    validation: { valid: boolean; message: string; mappedCount: number }
    onRequestSample: () => void
    onMappingChange: (value: string) => void
    onPaste: () => void
    onClear: () => void
    onAiParse: () => void
}) {
    return (
        <div className="grid min-h-[520px] gap-4 lg:grid-rows-[minmax(130px,0.7fr)_minmax(280px,1.5fr)_auto]">
            <section className="grid min-h-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-h-28 overflow-auto rounded-sm border border-theme-4 bg-theme-1/45 p-3 font-mono text-xs leading-5 text-accent-cyan-light">
                    {rawData ? <pre className="whitespace-pre-wrap">{rawData}</pre> : (
                        <div className="flex h-full items-center justify-center font-sans text-gray-7">
                            尚未获取设备样本
                        </div>
                    )}
                </div>
                <div className="flex min-w-40 flex-col justify-center gap-2">
                    <div className="text-sm font-medium">获取设备数据</div>
                    <Button
                        variant="outline"
                        disabled={sampleStatus === "running" || (mode === "active" && sampleStatus !== "idle")}
                        onClick={onRequestSample}
                    >
                        {sampleStatus === "running" && <LoaderCircle className="animate-spin" />}
                        {sampleStatus === "running"
                            ? "正在等待数据"
                            : sampleStatus === "success"
                                ? "样本已接收"
                                : mode === "active"
                                    ? "正在等待数据"
                                    : "请求数据"}
                    </Button>
                    <p className="text-xs text-gray-7">
                        {mode === "active" ? "按请求周期自动获取" : "手动触发一次样本请求"}
                    </p>
                </div>
            </section>

            <section className="relative flex min-h-0 flex-col overflow-hidden rounded-sm border border-theme-4 bg-theme-1/30">
                {aiStatus === "success" && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-positive-dark/60 bg-positive-dark/25 px-3 py-2 text-xs text-positive">
                        <CheckCircle2 className="size-4" />
                        <span className="font-semibold">AI 解析完成</span>
                        <span>识别 3 个标准属性；推测 rto_in_temp 为华氏度，已加入换算。</span>
                    </div>
                )}
                {aiStatus === "running" && (
                    <div className="flex items-center justify-between border-b border-accent/50 bg-accent/15 px-3 py-2 text-xs text-accent-light">
                        <span className="flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" />AI 自动解析运行中</span>
                        <span className="font-mono tabular-nums">{aiTokens} tokens</span>
                    </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-theme-4 px-3 py-2">
                    <div>
                        <div className="text-sm font-medium">解析配置</div>
                        <div className="text-xs text-gray-7">JSON Path → 标准 attrKey、时间和数值换算</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <Button size="sm" variant="ghost" disabled={aiStatus === "running"} onClick={onPaste}>
                            <ClipboardPaste />粘贴配置
                        </Button>
                        <Button size="sm" variant="ghost" disabled={!mappingText || aiStatus === "running"} onClick={onClear}>
                            <Eraser />清空配置
                        </Button>
                        <Button size="sm" disabled={!rawData || aiStatus === "running"} onClick={onAiParse}>
                            <Sparkles />AI 自动解析
                        </Button>
                    </div>
                </div>
                <textarea
                    value={mappingText}
                    disabled={aiStatus === "running"}
                    onChange={(event) => onMappingChange(event.target.value)}
                    className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-5 text-text outline-none placeholder:text-gray-7 disabled:cursor-wait disabled:opacity-60"
                    placeholder="粘贴配置，或获取设备样本后使用 AI 自动解析"
                    spellCheck={false}
                    aria-label="设备解析配置"
                />
            </section>

            <div className={cn(
                "flex min-h-9 items-center gap-2 border px-3 py-2 text-xs",
                validation.valid
                    ? "border-positive-dark/70 bg-positive-dark/20 text-positive"
                    : "border-theme-4 bg-theme-1/30 text-gray-7",
            )}>
                {validation.valid ? <CheckCircle2 className="size-4" /> : <TriangleAlert className="size-4" />}
                <span className="font-semibold">JSON 校验</span>
                <span>{validation.message}</span>
            </div>
        </div>
    )
}

function AccessTestStep({
    status,
    rawData,
    parsedValues,
    onTest,
}: {
    status: AsyncStatus
    rawData: string
    parsedValues: ParsedSensorValue[]
    onTest: () => void
}) {
    return (
        <div className="grid min-h-[500px] gap-4 lg:grid-cols-2">
            <section className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-theme-4 bg-theme-1/30">
                <div className="flex items-center justify-between gap-3 border-b border-theme-4 px-3 py-2">
                    <div>
                        <div className="font-medium">获取设备数据</div>
                        <div className="text-xs text-gray-7">发送测试请求并等待设备下传</div>
                    </div>
                    <Button variant="outline" disabled={status === "running"} onClick={onTest}>
                        {status === "running" ? <LoaderCircle className="animate-spin" /> : <TestTube2 />}
                        {status === "running" ? "等待下传" : status === "success" ? "重新测试" : "开始测试"}
                    </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-3 font-mono text-xs leading-5 text-accent-cyan-light">
                    {rawData ? <pre className="whitespace-pre-wrap">{rawData}</pre> : (
                        <div className="flex h-full items-center justify-center font-sans text-gray-7">
                            测试数据将在此显示
                        </div>
                    )}
                </div>
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-theme-4 bg-theme-1/30">
                <div className="border-b border-theme-4 px-3 py-2">
                    <div className="font-medium">数据解析结果</div>
                    <div className="text-xs text-gray-7">attrKey · value · time</div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-3">
                    {parsedValues.length > 0 ? (
                        <div className="space-y-2">
                            {parsedValues.map((item) => (
                                <div key={item.attrKey} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-l-2 border-accent bg-theme-2/60 px-3 py-2">
                                    <div className="min-w-0">
                                        <div className="truncate font-mono text-sm text-accent-cyan-light">{item.attrKey}</div>
                                        <div className="mt-1 text-xs text-gray-7">{item.timestamp}</div>
                                    </div>
                                    <div className="self-center text-right font-mono tabular-nums">
                                        <span className="text-lg font-semibold">{item.value.toFixed(1)}</span>
                                        <span className="ml-1 text-xs text-gray-7">{item.unit}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="flex items-center gap-2 pt-2 text-xs text-positive">
                                <CheckCircle2 className="size-4" />
                                3 个属性解析成功，时间戳与数值均有效
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-7">
                            {status === "running" ? "正在解析设备报文…" : "等待测试数据"}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

function StepHeading({ title, description }: { title: string; description: string }) {
    return (
        <div className="border-b border-theme-4 pb-3">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-gray-7">{description}</p>
        </div>
    )
}

function FormField({
    label,
    help,
    required = false,
    unit,
    children,
}: {
    label: string
    help?: string
    required?: boolean
    unit?: string
    children: ReactNode
}) {
    return (
        <label className="block min-w-0">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                {label}
                {required && <span className="text-negative">*</span>}
                {help && (
                    <span
                        className="inline-flex cursor-help text-gray-7"
                        aria-label={`${label}说明：${help}`}
                        title={help}
                    >
                        <HelpCircle className="size-3.5" />
                    </span>
                )}
                {unit && <span className="ml-auto text-xs font-normal text-gray-7">单位：{unit}</span>}
            </span>
            {children}
        </label>
    )
}

function ModeButton({
    active,
    icon,
    title,
    description,
    onClick,
}: {
    active: boolean
    icon: ReactNode
    title: string
    description: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={active}
            onClick={onClick}
            className={cn(
                "flex min-w-0 items-center gap-3 rounded-sm border px-3 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/60",
                active
                    ? "border-accent bg-accent/15"
                    : "border-theme-4 bg-theme-1/25 hover:bg-theme-3/40",
            )}
        >
            <span className={cn("[&_svg]:size-5", active ? "text-accent-light" : "text-gray-7")}>{icon}</span>
            <span className="min-w-0">
                <span className="block font-medium">{title}</span>
                <span className="block truncate text-xs text-gray-7">{description}</span>
            </span>
        </button>
    )
}

function ConnectionFeedback({ status, mode }: { status: AsyncStatus; mode: DeviceConnectionMode }) {
    if (status === "idle") return null

    return (
        <div className={cn(
            "mt-3 flex items-center gap-2 border px-3 py-2 text-xs",
            status === "success"
                ? "border-positive-dark/70 bg-positive-dark/20 text-positive"
                : "border-accent/50 bg-accent/10 text-accent-light",
        )}>
            {status === "running" ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {status === "running"
                ? "正在进行 DNS、TCP 与应用层握手…"
                : mode === "active"
                    ? "连接成功，设备响应 46 ms，返回 HTTP 200。"
                    : "接入路由已注册，测试发布返回 HTTP 202。"}
        </div>
    )
}

function validateMapping(value: string): { valid: boolean; message: string; mappedCount: number } {
    if (!value.trim()) return { valid: false, message: "尚未填写解析配置", mappedCount: 0 }
    try {
        const parsed = JSON.parse(value) as Record<string, unknown>
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
            return { valid: false, message: "顶层必须是 attrKey 配置对象", mappedCount: 0 }
        }
        const entries = Object.entries(parsed)
        if (entries.length === 0) return { valid: false, message: "至少配置一个 attrKey", mappedCount: 0 }
        const valid = entries.every(([, config]) => {
            if (!config || Array.isArray(config) || typeof config !== "object") return false
            const record = config as Record<string, unknown>
            return typeof record.time_from === "string" && typeof record.value_from === "string"
        })
        return valid
            ? { valid: true, message: `校验通过，包含 ${entries.length} 个属性映射`, mappedCount: entries.length }
            : { valid: false, message: "每项必须包含 time_from 和 value_from", mappedCount: 0 }
    } catch {
        return { valid: false, message: "JSON 格式错误，请检查括号、引号或逗号", mappedCount: 0 }
    }
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

const SELECT_CLASS_NAME = "h-8 w-full rounded-lg border border-input bg-theme-1/20 px-2.5 text-sm text-text outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
const TEXTAREA_CLASS_NAME = "w-full resize-none rounded-lg border border-input bg-theme-1/20 px-2.5 py-2 text-sm text-text outline-none placeholder:text-gray-7 focus:border-ring focus:ring-2 focus:ring-ring/40"
