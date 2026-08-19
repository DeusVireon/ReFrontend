import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const SENSOR_KEYS = [
    "ambient_temp",
    "ambient_humidity",
    "ambient_pressure",
    "coating_flow",
    "coating_conc",
    "coating_temp",
    "coating_pressure",
    "rotor_speed",
    "adsorption_fan_power",
    "desorption_fan_power",
    "rotor_inlet_temp",
    "rotor_inlet_humid",
    "desorption_temp",
    "concentrated_flow",
    "concentrated_conc",
    "concentrated_temp",
    "concentrated_pressure",
    "rto_in_flow",
    "rto_in_conc",
    "rto_in_temp",
    "rto_in_pressure",
    "burner_gas_flow",
    "combustion_temp",
    "rto_out_temp",
    "rto_out_conc",
]

const CELL_COUNT = 90
const COL = {
    sensor: 0,
    sensorStatus: 25,
    systemStatus: 50,
    overall: 56,
    log: 60,
    alert: 64,
    popup: 68,
    attrStatus: 77,
    prediction: 80,
    aiMessage: 83,
    aiTool: 86,
    dca: 88,
    viewFocus: 89,
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const round = (value, digits = 2) => Number(value.toFixed(digits))

function smoothStep(from, to, value) {
    const x = clamp((value - from) / (to - from), 0, 1)
    return x * x * (3 - 2 * x)
}

function incidentLoad(second) {
    if (second < 6) return 0
    if (second < 18) return smoothStep(6, 18, second)
    if (second < 32) return 1
    if (second < 45) return 1 - smoothStep(32, 45, second)
    return 0
}

function sensorValues(second) {
    const load = incidentLoad(second)
    const wave = (period, phase = 0) => Math.sin((second + phase) / period)

    return [
        round(23.4 + 0.55 * wave(11)),
        round(62.8 + 2.1 * wave(8, 2)),
        round(101.32 + 0.09 * wave(13)),
        round(8460 + 1380 * load + 80 * wave(3)),
        round(88 + 52 * load + 2.4 * wave(4)),
        round(27.1 + 0.8 * wave(7)),
        round(101.22 + 0.08 * wave(9)),
        round(4.82 - 0.28 * load + 0.035 * wave(3.5)),
        round(41.8 + 2.4 * load + 0.45 * wave(5)),
        round(3.15 + 0.38 * load + 0.08 * wave(4)),
        round(26.3 + 0.9 * wave(6)),
        round(63.7 + 2.2 * wave(8, 1)),
        round(205.6 - 8.4 * load + 0.65 * wave(4)),
        round(848 + 128 * load + 9 * wave(4)),
        round(426 + 218 * load + 8 * wave(3)),
        round(184.7 + 4.8 * load + 0.8 * wave(5)),
        round(101.46 + 0.11 * wave(8)),
        round(998 + 74 * load + 12 * wave(5)),
        round(418 + 184 * load + 7 * wave(3.5)),
        round(184.5 + 4.6 * load + 0.7 * wave(4.5)),
        round(101.41 + 0.1 * wave(9)),
        round(32.6 + 4.2 * load + 0.35 * wave(3)),
        round(786.5 - 30.5 * load + 1.8 * wave(2.8)),
        round(62.1 + 2.1 * load + 0.5 * wave(5)),
        round(21.8 + 23.6 * load + 1.2 * wave(3.4)),
    ]
}

function sensorStatuses(second) {
    const statuses = Array(25).fill(1)
    if (second >= 13 && second < 43) {
        statuses[12] = 0
        statuses[22] = 0
    }
    return statuses
}

function makePrediction(profile) {
    const profiles = {
        stable: (index) => 23.2 + index * 0.28 + 0.9 * Math.sin(index / 2.8),
        rising: (index) => 27.4 + index * 1.55 + 1.8 * Math.sin(index / 3.2),
        alarm: (index) => index <= 16
            ? 31.5 + index * 3.05 + 0.35 * Math.sin(index / 2.5)
            : 80.3 + (index - 16) * 0.87 + 0.12 * Math.sin(index / 2.5),
        sustained: (index) => 34.2 + index * 2.18 + Math.max(0, index - 10) * 0.28 + 1.6 * Math.sin(index / 2.4),
        recovery: (index) => 31.8 + 17 * Math.sin(Math.PI * index / 23) - index * 0.18,
    }

    const valueAt = profiles[profile]
    return Array.from({ length: 24 }, (_, index) => {
        const value = valueAt(index)
        const intervalWidth = 3.2 + index * 0.34
        return {
            offsetMs: (index + 1) * 15 * 60 * 1000,
            value: round(value),
            lower90: round(Math.max(0, value - intervalWidth)),
            upper90: round(value + intervalWidth * 1.18),
            q10: round(Math.max(0, value - intervalWidth * 0.72)),
            q50: round(value),
            q90: round(value + intervalWidth * 0.82),
        }
    })
}

function setPrediction(cells, risk, quality, profile) {
    cells[COL.prediction] = risk
    cells[COL.prediction + 1] = quality
    cells[COL.prediction + 2] = JSON.stringify(makePrediction(profile))
}

function setLog(cells, id, name, content, level = 1) {
    cells.splice(COL.log, 4, id, name, content, level)
}

function setAlert(cells, id, title, content, level) {
    cells.splice(COL.alert, 4, id, title, content, level)
}

function setPopup(cells, {
    type,
    title,
    level,
    levelText,
    keyValueColor,
    keyValueTitle,
    keyValueContent,
    content,
}) {
    cells.splice(
        COL.popup,
        9,
        type,
        title,
        level,
        levelText,
        keyValueColor,
        keyValueTitle,
        keyValueContent,
        "text",
        content,
    )
}

function setAiMessage(cells, id, content) {
    cells[COL.aiMessage] = id
    cells[COL.aiMessage + 1] = "assistant"
    cells[COL.aiMessage + 2] = content
}

function dcaRule({ id, name, kind, status, score, sensorKeys, summary, currentValue, referenceValue, unit }) {
    return {
        id,
        name,
        kind,
        status,
        score,
        sensorKeys,
        summary,
        window: "最近 6 小时",
        condition: `参考值 ${referenceValue}${unit}`,
        currentValue,
        referenceValue,
        unit,
        history: [-3, -2, -1, 0].map((offsetHours, index) => ({
            offsetHours,
            value: round(referenceValue + (currentValue - referenceValue) * index / 3, 3),
            baseline: referenceValue,
        })),
    }
}

function makeDcaSnapshot(stage) {
    const presets = {
        normal: { score: 18.4, lag: 1.0, corr: 0.79, temperature: 786.5, applicability: "reliable" },
        attention: { score: 34.8, lag: 1.25, corr: 0.68, temperature: 770.4, applicability: "limited" },
        warning: { score: 46.3, lag: 1.5, corr: 0.61, temperature: 756.2, applicability: "limited" },
        recovery: { score: 24.1, lag: 1.1, corr: 0.75, temperature: 784.1, applicability: "reliable" },
    }
    const current = presets[stage]
    const warning = stage === "warning"
    const attention = warning || stage === "attention"

    return {
        score: current.score,
        scoreThreshold: 60,
        predictionApplicability: current.applicability,
        sustainedMinutes: warning ? 42 : attention ? 18 : 0,
        statuses: [
            { id: "production", label: warning ? "负荷快速上升" : attention ? "负荷抬升" : "稳定生产", level: warning ? "warning" : attention ? "attention" : "normal" },
            { id: "data", label: "数据完整", level: "normal" },
        ],
        scoreHistory: [-6, -5, -4, -3, -2, -1, 0].map((offsetHours, index) => ({
            offsetHours,
            score: round(18.4 + (current.score - 18.4) * index / 6),
        })),
        rules: [
            dcaRule({
                id: "rto-lag-shift",
                name: "RTO 入口与出口时滞",
                kind: "cross_correlation_shift",
                status: attention ? "warning" : "normal",
                score: attention ? 12.1 : 3.2,
                sensorKeys: ["rto_in_conc", "rto_out_conc"],
                summary: `浓度传递主时滞为 ${current.lag.toFixed(2)} h`,
                currentValue: current.lag,
                referenceValue: 1.0,
                unit: " h",
            }),
            dcaRule({
                id: "in-out-corr",
                name: "RTO 入口与出口相关性",
                kind: "cross_correlation_peak",
                status: attention ? "attention" : "normal",
                score: attention ? 9.4 : 2.7,
                sensorKeys: ["rto_in_conc", "rto_out_conc"],
                summary: `最大互相关系数为 ${current.corr.toFixed(2)}`,
                currentValue: current.corr,
                referenceValue: 0.75,
                unit: "",
            }),
            dcaRule({
                id: "combustion-temp",
                name: "燃烧室温度",
                kind: "limit",
                status: warning ? "warning" : attention ? "attention" : "normal",
                score: warning ? 10.8 : attention ? 6.5 : 2.1,
                sensorKeys: ["combustion_temp"],
                summary: `燃烧室温度为 ${current.temperature.toFixed(1)} C`,
                currentValue: current.temperature,
                referenceValue: 785,
                unit: " C",
            }),
            dcaRule({
                id: "rotor-cycle",
                name: "转轮周期稳定性",
                kind: "autocorrelation_peak",
                status: attention ? "attention" : "normal",
                score: attention ? 7.2 : 2.4,
                sensorKeys: ["rotor_speed"],
                summary: attention ? "转轮周期重复性轻微下降" : "转轮周期与稳定工况一致",
                currentValue: attention ? 0.64 : 0.78,
                referenceValue: 0.75,
                unit: "",
            }),
            dcaRule({
                id: "production-calendar",
                name: "生产周期状态",
                kind: "time_periodic",
                status: "normal",
                score: 1.2,
                sensorKeys: ["timestamp", "rotor_speed"],
                summary: "当前班次与生产日历一致",
                currentValue: 1,
                referenceValue: 1,
                unit: "",
            }),
        ],
    }
}

function applyScenarioEvents(second, cells) {
    if (second === 0) {
        cells.splice(COL.systemStatus, 6, 1, 1, 1, "正常", "正常", "正常")
        cells.splice(COL.overall, 4, 1, "<EMPTY>", 1, "<EMPTY>")
        setLog(cells, 1, "系统", "模拟数据链路已连接", 1)
        setAlert(cells, 1, "系统已连接", "当前使用完整 VOCs 演示数据", 1)
        setPrediction(cells, 12.4, 98.6, "stable")
        cells[COL.dca] = JSON.stringify(makeDcaSnapshot("normal"))
    }

    if (second === 8) {
        setPrediction(cells, 42.7, 98.2, "rising")
        setLog(cells, 2, "预测", "检测到上游负荷持续上升", 2)
        cells.splice(COL.overall, 4, 1, "<EMPTY>", 0, "预测风险正在升高")
        cells[COL.dca] = JSON.stringify(makeDcaSnapshot("attention"))
    }

    if (second === 14) {
        cells.splice(COL.attrStatus, 3, "combustion_temp", 0, "[2]")
        setAlert(cells, 2, "燃烧工况偏离", "燃烧室温度下降且入口浓度持续上升", 2)
    }

    if (second === 18) {
        setPrediction(cells, 78.6, 96.8, "alarm")
        setAlert(cells, 3, "未来 6 小时 VOCs 超标风险", "预测曲线将在约 4 小时后越过 80 mg/m3", 2)
        setPopup(cells, {
            type: "预测预警",
            title: "未来 6 小时 VOCs 存在超标风险",
            level: 2,
            levelText: "关注",
            keyValueColor: 2,
            keyValueTitle: "预测峰值",
            keyValueContent: "86.4",
            content: "模拟预测显示 RTO 出口浓度将在约 4 小时后越过 80 mg/m3。",
        })
        cells.splice(COL.overall, 4, 1, "<EMPTY>", -1, "预测推理提示超标")
        setLog(cells, 3, "预测", "未来 6 小时风险预警已生成", 2)
        setAiMessage(
            cells,
            1001,
            "检测到未来 6 小时 VOCs 超标风险：预测峰值约 86.4 mg/m3。演示数据中，RTO 入口浓度上升与燃烧室温度下降先于风险抬升。",
        )
        cells[COL.aiTool] = 1
        cells[COL.aiTool + 1] = "智能体发现新的预测预警"
        cells[COL.dca] = JSON.stringify(makeDcaSnapshot("warning"))
    }

    if (second === 30) {
        setPrediction(cells, 72.1, 97.1, "sustained")
        setLog(cells, 4, "DCA", "工况关系偏离持续，建议关注燃烧段", 2)
        setAlert(cells, 4, "工况关系偏离", "入口-出口时滞延长至 1.5 小时", 2)
    }

    if (second === 45) {
        setPrediction(cells, 18.3, 99.0, "recovery")
        cells.splice(COL.overall, 4, 1, "<EMPTY>", 1, "<EMPTY>")
        cells.splice(COL.attrStatus, 3, "combustion_temp", 1, "[]")
        setLog(cells, 5, "预测", "风险已回落至正常区间", 1)
        setAlert(cells, 5, "预测风险解除", "最新预测曲线已全部回落至 80 mg/m3 以下", 1)
        setAiMessage(
            cells,
            1002,
            "最新一轮模拟预测已回落至阈值以下，风险概率降至 18.3%。可继续观察 RTO 入口浓度与燃烧室温度。",
        )
        cells[COL.aiTool] = 1
        cells[COL.aiTool + 1] = "风险已回落，可查看处置记录"
        cells[COL.dca] = JSON.stringify(makeDcaSnapshot("recovery"))
    }
}

function applyPersistentScenarioState(second, cells) {
    if (second < 8) {
        setPrediction(cells, 12.4, 98.6, "stable")
        cells[COL.dca] = JSON.stringify(makeDcaSnapshot("normal"))
        return
    }
    if (second < 18) {
        setPrediction(cells, 42.7, 98.2, "rising")
        cells[COL.dca] = JSON.stringify(makeDcaSnapshot("attention"))
        return
    }
    if (second < 30) {
        setPrediction(cells, 78.6, 96.8, "alarm")
        cells[COL.dca] = JSON.stringify(makeDcaSnapshot("warning"))
        return
    }
    if (second < 45) {
        setPrediction(cells, 72.1, 97.1, "sustained")
        cells[COL.dca] = JSON.stringify(makeDcaSnapshot("warning"))
        return
    }

    setPrediction(cells, 18.3, 99.0, "recovery")
    cells[COL.dca] = JSON.stringify(makeDcaSnapshot("recovery"))
}

function escapeCsv(value) {
    if (value === null || value === undefined) return ""
    const text = String(value)
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function makeRow(second) {
    const cells = Array(CELL_COUNT).fill(null)
    cells.splice(COL.sensor, SENSOR_KEYS.length, ...sensorValues(second))
    cells.splice(COL.sensorStatus, SENSOR_KEYS.length, ...sensorStatuses(second))
    cells.splice(COL.systemStatus, 6, 1, 1, 1, "正常", "正常", "正常")
    applyPersistentScenarioState(second, cells)
    applyScenarioEvents(second, cells)

    if (cells.length !== CELL_COUNT) {
        throw new Error(`Invalid cell count at second ${second}: ${cells.length}`)
    }

    return [second * 1000, ...cells].map(escapeCsv).join(",")
}

const groupHeader = [
    "//",
    ...Array(CELL_COUNT).fill(""),
]
groupHeader[1] = "Sensor Data"
groupHeader[26] = "Sensor Status"
groupHeader[51] = "System Status"
groupHeader[57] = "Overall Status"
groupHeader[61] = "Log Data"
groupHeader[65] = "Alert Data"
groupHeader[69] = "Alert Popup"
groupHeader[78] = "Attr Status"
groupHeader[81] = "Predict Result"
groupHeader[84] = "AI Message"
groupHeader[87] = "AI Tool"
groupHeader[89] = "DCA"

const columnHeader = [
    "//",
    ...SENSOR_KEYS,
    ...SENSOR_KEYS,
    "BackendStatus", "HistoryAnalyzerStatus", "PredictorStatus", "BackendText", "HistoryAnalyzerText", "PredictorText",
    "sysStatus", "sysPrompt", "bizStatus", "bizPrompt",
    "id", "name", "content", "level",
    "id", "title", "content", "level",
    "type", "title", "level", "levelText", "keyValueColor", "keyValueTitle", "keyValueContent", "contentType", "content",
    "key", "status", "linkedAlerts",
    "MaxExceedProb", "InputDataQuantity", "PredSteps",
    "id", "type", "content",
    "indicator", "tip",
    "DCASubSystem",
    "ViewFocus",
]

if (columnHeader.length !== CELL_COUNT + 1) {
    throw new Error(`Invalid header count: ${columnHeader.length}`)
}

const output = [
    groupHeader.map(escapeCsv).join(","),
    "//,CONFIG",
    "*,MOCK_TIME_SCALE,120",
    "*,DEFAULT_WINDOW_MS,30000",
    "//,DATA",
    columnHeader.map(escapeCsv).join(","),
    ...Array.from({ length: 76 }, (_, second) => makeRow(second)),
    "",
].join("\n")

const scriptDir = dirname(fileURLToPath(import.meta.url))
const outputPath = resolve(scriptDir, "../public/mock-data.csv")
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, output, "utf8")

console.log(`Generated ${outputPath}`)
console.log("Scenario: stable -> rising load -> forecast alarm -> recovery")
console.log("Data rows: 76; payload cells per row: 90")
