import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const realCasePath = resolve(scriptDir, "./data/pa-pft-real-cases.json")
const realCaseBundle = JSON.parse(readFileSync(realCasePath, "utf8"))
const REAL_CASES = [...realCaseBundle.cases].sort(
    (left, right) => left.video_second - right.video_second,
)
const CASE_BY_ID = Object.fromEntries(REAL_CASES.map((item) => [item.id, item]))

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

function surroundingCases(second) {
    const nextIndex = REAL_CASES.findIndex((item) => item.video_second >= second)
    if (nextIndex <= 0) return [REAL_CASES[0], REAL_CASES[0], 0]
    if (nextIndex < 0) {
        const last = REAL_CASES.at(-1)
        return [last, last, 0]
    }

    const previous = REAL_CASES[nextIndex - 1]
    const next = REAL_CASES[nextIndex]
    const ratio = smoothStep(previous.video_second, next.video_second, second)
    return [previous, next, ratio]
}

function sensorValues(second) {
    const [previous, next, ratio] = surroundingCases(second)
    return SENSOR_KEYS.map((key) => round(
        previous.sensor_values[key]
        + (next.sensor_values[key] - previous.sensor_values[key]) * ratio,
        3,
    ))
}

function sensorStatuses() {
    return Array(25).fill(1)
}

function predictionForCase(realCase) {
    return realCase.prediction_steps.map((step) => ({
        offsetMs: step.offset_minutes * 60 * 1000,
        value: round(step.point),
        lower90: round(step.lower_90),
        upper90: round(step.upper_90),
        q10: round(step.q10),
        q50: round(step.q50),
        q90: round(step.q90),
    }))
}

function setPrediction(cells, realCase, quality = 99.2) {
    cells[COL.prediction] = round(
        realCase.summary.calibrated_exceed_probability * 100,
        2,
    )
    cells[COL.prediction + 1] = quality
    cells[COL.prediction + 2] = JSON.stringify(predictionForCase(realCase))
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

function activeCase(second) {
    return [...REAL_CASES]
        .reverse()
        .find((item) => item.video_second <= second) ?? REAL_CASES[0]
}

function dcaStageForCase(realCase) {
    if (realCase.role === "risk_alarm" || realCase.role === "risk_confirming" || realCase.role === "point_exceed") {
        return "warning"
    }
    if (realCase.role === "rising") return "attention"
    if (realCase.role === "recovery") return "recovery"
    return "normal"
}

function applyScenarioEvents(second, cells) {
    if (second === 0) {
        cells.splice(COL.systemStatus, 6, 1, 1, 1, "正常", "正常", "正常")
        cells.splice(COL.overall, 4, 1, "<EMPTY>", 1, "<EMPTY>")
        setLog(cells, 1, "系统", "数据链路已连接", 1)
        setAlert(cells, 1, "系统已连接", "当前数据源连接正常", 1)
    }

    if (second === 18) {
        const realCase = CASE_BY_ID.rising_reference
        setLog(cells, 2, "预测", `未来 6 小时预测峰值更新为 ${realCase.summary.point_max_mg_m3.toFixed(1)} mg/m3`, 1)
        cells.splice(COL.overall, 4, 1, "<EMPTY>", 0, "预测风险正在升高")
    }

    if (second === 36) {
        const realCase = CASE_BY_ID.early_risk
        const risk = realCase.summary.calibrated_exceed_probability * 100
        const threshold = realCase.summary.calibrated_alarm_threshold * 100
        const upperPeak = Math.max(...realCase.prediction_steps.map((step) => step.upper_90))
        setAlert(
            cells,
            3,
            "未来 6 小时 VOCs 风险概率越过阈值",
            `校准风险 ${risk.toFixed(1)}%，报警阈值 ${threshold.toFixed(1)}%`,
            2,
        )
        setPopup(cells, {
            type: "风险概率预警",
            title: "未来 6 小时 VOCs 风险概率升高",
            level: 2,
            levelText: "关注",
            keyValueColor: 2,
            keyValueTitle: "校准风险",
            keyValueContent: `${risk.toFixed(1)}%`,
            content: `校准风险已超过 ${threshold.toFixed(1)}% 报警阈值。点预测峰值 ${realCase.summary.point_max_mg_m3.toFixed(1)} mg/m3，90% 区间上界最高 ${upperPeak.toFixed(1)} mg/m3。`,
        })
        cells.splice(COL.overall, 4, 1, "<EMPTY>", -1, "未来风险概率超过报警阈值")
        setLog(cells, 3, "预测", "未来 6 小时风险概率预警已生成", 2)
        setAiMessage(
            cells,
            1001,
            `未来 6 小时校准风险为 ${risk.toFixed(1)}%，已超过 ${threshold.toFixed(1)}% 报警阈值；正式点预测峰值 ${realCase.summary.point_max_mg_m3.toFixed(1)} mg/m3，当前尚未越过 80 mg/m3。`,
        )
        cells[COL.aiTool] = 1
        cells[COL.aiTool + 1] = "收到新的预测预警"
    }

    if (second === 52) {
        const realCase = CASE_BY_ID.near_event
        setLog(
            cells,
            4,
            "预测",
            `风险提示持续，点预测峰值更新为 ${realCase.summary.point_max_mg_m3.toFixed(1)} mg/m3`,
            2,
        )
    }

    if (second === 68) {
        const realCase = CASE_BY_ID.point_exceed
        const firstStep = realCase.summary.point_first_exceed_step
        const minutesAhead = firstStep * 15
        setAlert(
            cells,
            4,
            "预测曲线越过 80 mg/m3",
            `预测峰值 ${realCase.summary.point_max_mg_m3.toFixed(1)} mg/m3，首次越线约 ${minutesAhead} 分钟后`,
            3,
        )
        setPopup(cells, {
            type: "预测越线预警",
            title: "RTO 出口浓度预测超过限值",
            level: 3,
            levelText: "预警",
            keyValueColor: 3,
            keyValueTitle: "预测峰值",
            keyValueContent: `${realCase.summary.point_max_mg_m3.toFixed(1)}`,
            content: `最新 24 点预测中，第 ${firstStep} 个点超过 80 mg/m3，对应约 ${minutesAhead} 分钟后。`,
        })
        cells.splice(COL.overall, 4, 1, "<EMPTY>", -1, "预测曲线超过 80 mg/m3")
        setLog(cells, 5, "预测", "点预测越线预警已生成", 3)
        setAiMessage(
            cells,
            1002,
            `最新 6 小时预测峰值为 ${realCase.summary.point_max_mg_m3.toFixed(1)} mg/m3，第 ${firstStep} 个预测点超过 80 mg/m3。`,
        )
        cells[COL.aiTool] = 1
        cells[COL.aiTool + 1] = "预测越线状态已更新"
    }

    if (second === 90) {
        const realCase = CASE_BY_ID.recovery
        const risk = realCase.summary.calibrated_exceed_probability * 100
        cells.splice(COL.overall, 4, 1, "<EMPTY>", 1, "<EMPTY>")
        setLog(cells, 5, "预测", "风险已回落至正常区间", 1)
        setAlert(cells, 5, "预测风险解除", "最新预测曲线已全部回落至 80 mg/m3 以下", 1)
        setAiMessage(
            cells,
            1003,
            `最新 6 小时预测峰值已回落至 ${realCase.summary.point_max_mg_m3.toFixed(1)} mg/m3，校准风险为 ${risk.toFixed(1)}%，低于报警阈值。`,
        )
        cells[COL.aiTool] = 1
        cells[COL.aiTool + 1] = "最新预测已更新"
    }
}

function applyPersistentScenarioState(second, cells) {
    const realCase = activeCase(second)
    setPrediction(cells, realCase)
    cells[COL.dca] = JSON.stringify(makeDcaSnapshot(dcaStageForCase(realCase)))
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
    ...Array.from({ length: 121 }, (_, second) => makeRow(second)),
    "",
].join("\n")

const outputPath = resolve(scriptDir, "../public/mock-data.csv")
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, output, "utf8")

console.log(`Generated ${outputPath}`)
console.log(`PA-PFT cases: ${realCasePath}`)
console.log("Scenario: stable -> rising -> probability alarm -> point exceed -> recovery")
console.log("Data rows: 121; payload cells per row: 90")
