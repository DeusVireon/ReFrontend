/**
 * DataAnalyze 模拟完整快照（写死数值，集中于此）
 */
import type { AnalyzePayload, SeriesStat, TimeSeriesPoint } from '@/views/DataAnalyze/models/AnalyzeTypes'

const BASE_VALUES: Record<string, number> = {
    ambient_temp: 21.5,
    ambient_humidity: 65.3,
    ambient_pressure: 101.3,
    coating_flow: 8500.5,
    coating_conc: 95.2,
    coating_temp: 25.3,
    coating_pressure: 101.2,
    rotor_speed: 4.75,
    adsorption_fan_power: 42.5,
    desorption_fan_power: 3.2,
    rotor_inlet_temp: 26.1,
    rotor_inlet_humid: 64.8,
    desorption_temp: 205.3,
    concentrated_flow: 850.2,
    concentrated_conc: 420.5,
    concentrated_temp: 185.2,
    concentrated_pressure: 101.5,
    rto_in_flow: 1000.3,
    rto_in_conc: 415.2,
    rto_in_temp: 185.1,
    rto_in_pressure: 101.4,
    burner_gas_flow: 32.5,
    combustion_temp: 757.8,
    rto_out_conc: 18.5,
    rto_out_temp: 62.3,
}

const WAVE: Record<string, number> = {
    ambient_temp: 0.8,
    ambient_humidity: 3.5,
    ambient_pressure: 0.2,
    coating_flow: 180,
    coating_conc: 12,
    coating_temp: 1.1,
    coating_pressure: 0.15,
    rotor_speed: 0.12,
    adsorption_fan_power: 2.2,
    desorption_fan_power: 0.25,
    rotor_inlet_temp: 1.0,
    rotor_inlet_humid: 3.0,
    desorption_temp: 4.5,
    concentrated_flow: 28,
    concentrated_conc: 35,
    concentrated_temp: 4.0,
    concentrated_pressure: 0.2,
    rto_in_flow: 30,
    rto_in_conc: 28,
    rto_in_temp: 4.0,
    rto_in_pressure: 0.2,
    burner_gas_flow: 1.8,
    combustion_temp: 9.0,
    rto_out_conc: 3.5,
    rto_out_temp: 2.2,
}

const POINT_COUNT = 48
const STEP_MS = 5 * 60 * 1000

function buildSeries(): TimeSeriesPoint[] {
    const end = Date.UTC(2026, 7, 11, 10, 0, 0)
    const keys = Object.keys(BASE_VALUES)

    return Array.from({ length: POINT_COUNT }, (_, i) => {
        const timestamp = new Date(end - (POINT_COUNT - 1 - i) * STEP_MS).toISOString()
        const values: Record<string, number> = {}

        for (const key of keys) {
            //采取波浪形的曲线展示方式
            const base = BASE_VALUES[key]!
            const amp = WAVE[key] ?? 1
            const wave = Math.sin(i / 5 + key.length * 0.35) * amp
            const drift = ((i / POINT_COUNT) - 0.5) * amp * 0.4
            const anomaly = i >= 30 && i <= 34 && (key.includes('conc') || key === 'combustion_temp')
                ? amp * 1.8
                : 0
            const precision = key === 'rotor_speed' ? 2 : 1
            values[key] = Number((base + wave + drift + anomaly).toFixed(precision))
        }

        return { timestamp, values }
    })
}

function buildStats(series: TimeSeriesPoint[]): SeriesStat[] {
    const keys = Object.keys(BASE_VALUES)

    return keys.map((key) => {
        const nums = series.map((p) => p.values[key]!).filter((n) => Number.isFinite(n))
        const latest = nums[nums.length - 1] ?? 0
        const min = Math.min(...nums)
        const max = Math.max(...nums)
        const avg = nums.reduce((s, n) => s + n, 0) / (nums.length || 1)
        const precision = key === 'rotor_speed' ? 2 : 1

        return {
            key,
            latest: Number(latest.toFixed(precision)),
            min: Number(min.toFixed(precision)),
            max: Number(max.toFixed(precision)),
            avg: Number(avg.toFixed(precision)),
        }
    })
}

const SERIES = buildSeries()

export const MOCK_ANALYZE_PAYLOAD: AnalyzePayload = {
    updatedAt: SERIES[SERIES.length - 1]!.timestamp,
    windowLabel: '近 4 小时 · 5 分钟采样',
    series: SERIES,
    stats: buildStats(SERIES),
}

export function createMockAnalyzePayload(): AnalyzePayload {
    return MOCK_ANALYZE_PAYLOAD
}
