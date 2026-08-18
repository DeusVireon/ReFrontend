import { useState } from "react"
import { Link } from "react-router"
import {
    Activity,
    ArrowLeft,
    Bell,
    Cable,
    Database,
    Gauge,
    KeyRound,
    RadioTower,
    Settings2,
    ShieldCheck,
    Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DeviceConnectionDialog } from "./components/DeviceConnectionDialog"
import {
    INITIAL_DEVICES,
    createDeviceRecord,
    type DeviceConnectionMode,
    type DeviceConnectionStatus,
    type DeviceDraft,
    type DeviceRecord,
} from "./models/device"

const SETTINGS_NAVIGATION = [
    {
        section: "设备与数据",
        items: [
            { label: "设备接入", icon: Cable, active: true },
            { label: "属性字典", icon: Database, active: false },
            { label: "采集策略", icon: Activity, active: false },
        ],
    },
    {
        section: "系统",
        items: [
            { label: "运行参数", icon: Gauge, active: false },
            { label: "通知规则", icon: Bell, active: false },
            { label: "用户与权限", icon: Users, active: false },
            { label: "访问密钥", icon: KeyRound, active: false },
        ],
    },
] as const

export function SettingsView() {
    const [devices, setDevices] = useState<DeviceRecord[]>(INITIAL_DEVICES)
    const [successMessage, setSuccessMessage] = useState("")

    const handleDeviceComplete = (draft: DeviceDraft) => {
        const nextDevice = createDeviceRecord(draft, devices.length + 26)
        setDevices((current) => [nextDevice, ...current])
        setSuccessMessage(`${nextDevice.displayName} 已完成接入并开始接收数据`)
        window.setTimeout(() => setSuccessMessage(""), 5000)
    }

    return (
        <main className="min-h-screen bg-theme-1 text-text">
            <header className="flex h-16 items-center justify-between border-b border-theme-4 bg-theme-2/90 px-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <Link
                        to="/"
                        className="flex size-8 shrink-0 items-center justify-center rounded-sm text-gray-7 outline-none hover:bg-theme-3 hover:text-text focus-visible:ring-2 focus-visible:ring-accent/70"
                        aria-label="返回监控看板"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-accent/20 text-accent-light">
                        <Settings2 className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-semibold">系统设置</h1>
                        <p className="hidden text-xs text-gray-7 sm:block">设备、数据接入与运行参数</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-positive">
                    <ShieldCheck className="size-4" />
                    <span className="hidden sm:inline">配置服务运行正常</span>
                </div>
            </header>

            <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-[220px_minmax(0,1fr)]">
                <aside className="hidden border-r border-theme-4 bg-theme-2/45 p-3 md:block">
                    <nav aria-label="设置导航" className="space-y-5">
                        {SETTINGS_NAVIGATION.map((group) => (
                            <div key={group.section}>
                                <div className="mb-1.5 px-2 text-[11px] font-medium uppercase text-gray-7">
                                    {group.section}
                                </div>
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const Icon = item.icon
                                        return (
                                            <button
                                                key={item.label}
                                                type="button"
                                                disabled={!item.active}
                                                aria-current={item.active ? "page" : undefined}
                                                className={cn(
                                                    "flex h-9 w-full items-center gap-2 rounded-sm px-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/60",
                                                    item.active
                                                        ? "bg-accent/20 font-medium text-accent-light"
                                                        : "text-gray-7 hover:bg-theme-3/60 hover:text-text disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-gray-7",
                                                )}
                                            >
                                                <Icon className="size-4" />
                                                {item.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </aside>

                <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
                    <div className="mx-auto max-w-[1320px]">
                        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-theme-4 pb-4">
                            <div>
                                <div className="mb-1 flex items-center gap-2 text-xs text-accent-cyan-light">
                                    <RadioTower className="size-3.5" />
                                    数据采集
                                </div>
                                <h2 className="text-2xl font-semibold">设备接入</h2>
                                <p className="mt-1 max-w-2xl text-sm text-gray-7">
                                    管理现场设备连接，并将厂商字段映射为系统统一的 attrKey。
                                </p>
                            </div>
                            <DeviceConnectionDialog onComplete={handleDeviceComplete} />
                        </div>

                        {successMessage && (
                            <div className="mt-4 flex items-center gap-2 border border-positive-dark/70 bg-positive-dark/20 px-3 py-2 text-sm text-positive" role="status">
                                <ShieldCheck className="size-4" />
                                {successMessage}
                            </div>
                        )}

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm text-gray-7">
                                已登记 <span className="font-mono font-semibold text-text">{devices.length}</span> 台设备，
                                <span className="text-positive">{devices.filter((device) => device.status === "online").length} 台在线</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-7">
                                <span className="size-2 rounded-full bg-positive" />在线
                                <span className="ml-2 size-2 rounded-full bg-attention" />需关注
                                <span className="ml-2 size-2 rounded-full bg-negative" />离线
                            </div>
                        </div>

                        <div className="mt-3 overflow-x-auto border-y border-theme-4">
                            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                                <thead className="bg-theme-2/70 text-xs text-gray-7">
                                    <tr>
                                        <th className="px-3 py-3 font-medium">设备</th>
                                        <th className="px-3 py-3 font-medium">主 attrKey</th>
                                        <th className="px-3 py-3 font-medium">接入方式</th>
                                        <th className="px-3 py-3 font-medium">连接端点</th>
                                        <th className="px-3 py-3 font-medium">状态</th>
                                        <th className="px-3 py-3 font-medium">最近通信</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-theme-4/70">
                                    {devices.map((device) => (
                                        <DeviceRow key={device.id} device={device} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}

function DeviceRow({ device }: { device: DeviceRecord }) {
    return (
        <tr className="bg-theme-1/20 transition-colors hover:bg-theme-2/55">
            <td className="px-3 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-theme-4 bg-theme-2 text-accent-cyan-light">
                        <RadioTower className="size-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium">{device.displayName}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-7">
                            <span className="font-mono">{device.id}</span>
                            <span className="truncate">{device.description}</span>
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-3 py-3.5">
                <div className="font-mono text-xs text-accent-cyan-light">{device.primaryAttrKey}</div>
                <div className="mt-1 text-xs text-gray-7">共 {device.mappedAttrCount} 个映射</div>
            </td>
            <td className="px-3 py-3.5">
                <ModeLabel mode={device.mode} />
            </td>
            <td className="max-w-56 truncate px-3 py-3.5 font-mono text-xs text-gray-7" title={device.endpoint}>
                {device.endpoint}
            </td>
            <td className="px-3 py-3.5">
                <StatusLabel status={device.status} />
            </td>
            <td className="px-3 py-3.5 text-xs text-gray-7">{device.lastSeen}</td>
        </tr>
    )
}

function ModeLabel({ mode }: { mode: DeviceConnectionMode }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-7">
            {mode === "active" ? <Activity className="size-3.5" /> : <Cable className="size-3.5" />}
            {mode === "active" ? "主动采集" : "被动接收"}
        </span>
    )
}

function StatusLabel({ status }: { status: DeviceConnectionStatus }) {
    const labels: Record<DeviceConnectionStatus, string> = {
        online: "在线",
        warning: "通信延迟",
        offline: "离线",
    }
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium",
            status === "online" && "text-positive",
            status === "warning" && "text-attention",
            status === "offline" && "text-negative",
        )}>
            <span className={cn(
                "size-2 rounded-full",
                status === "online" && "bg-positive",
                status === "warning" && "bg-attention",
                status === "offline" && "bg-negative",
            )} />
            {labels[status]}
        </span>
    )
}
