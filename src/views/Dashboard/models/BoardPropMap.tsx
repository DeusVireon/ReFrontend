import { ModelPartEnum } from "./ModelPartEnum";
import { AttrKeyEnum } from "../models/AttrKeyEnum";

export interface DataBoardProps {
    title: string;
    linkedData: DataItemProps[];
}

export interface DataItemProps {
    attrKey: string;
    showName: string;
    showUnit: string;
}

export const BOARD_PROP_MAP: Record<ModelPartEnum, DataBoardProps> = {
    [ModelPartEnum.Ambient]: {
        title: "环境数据",
        linkedData: [
            { attrKey: AttrKeyEnum.AmbientHumidity, showName: "环境湿度", showUnit: "%" },
            { attrKey: AttrKeyEnum.AmbientPressure, showName: "大气压力", showUnit: "kPa" },
            { attrKey: AttrKeyEnum.AmbientTemp, showName: "环境温度", showUnit: "℃" },
        ]
    },
    [ModelPartEnum.Inlet]: {
        title: "废气入口数据",
        linkedData: [
            { attrKey: AttrKeyEnum.CoatingConc, showName: "进气浓度", showUnit: "mg/m³" },
            { attrKey: AttrKeyEnum.CoatingFlow, showName: "进气流量", showUnit: "m³/h" },
            { attrKey: AttrKeyEnum.CoatingPressure, showName: "涂布气压", showUnit: "kPa" },
            { attrKey: AttrKeyEnum.CoatingTemp, showName: "进气温度", showUnit: "℃" },
        ]
    },
    [ModelPartEnum.Rotor]: {
        title: "转轮系统",
        linkedData: [
            { attrKey: AttrKeyEnum.RotorInletTemp, showName: "入口温度", showUnit: "℃" },
            { attrKey: AttrKeyEnum.RotorInletHumid, showName: "入口湿度", showUnit: "%" },
            { attrKey: AttrKeyEnum.RotorSpeed, showName: "转轮转速", showUnit: "rpm" },
        ]
    },
    [ModelPartEnum.AdsorptionFan]: {
        title: "吸附风机",
        linkedData: [
            { attrKey: AttrKeyEnum.AdsorptionFanPower, showName: "风机功率", showUnit: "kW" },
        ]
    },
    [ModelPartEnum.DesorptionFan]: {
        title: "解吸风机",
        linkedData: [
            { attrKey: AttrKeyEnum.DesorptionTemp, showName: "解吸温度", showUnit: "℃" },
            { attrKey: AttrKeyEnum.DesorptionFanPower, showName: "风机功率", showUnit: "kW" },
        ]
    },
    [ModelPartEnum.Concentrated]: {
        title: "浓缩气体通路",
        linkedData: [
            { attrKey: AttrKeyEnum.ConcentratedTemp, showName: "浓缩气温", showUnit: "℃" },
            { attrKey: AttrKeyEnum.ConcentratedFlow, showName: "浓缩气流", showUnit: "m³/h" },
            { attrKey: AttrKeyEnum.ConcentratedPressure, showName: "浓缩气压", showUnit: "kPa" },
            { attrKey: AttrKeyEnum.ConcentratedConc, showName: "浓缩浓度", showUnit: "mg/m³" },
        ]
    },
    [ModelPartEnum.CombustionChamber]: {
        title: "RTO焚烧炉系统",
        linkedData: [
            { attrKey: AttrKeyEnum.RTOInFlow, showName: "进气流量", showUnit: "m³/h" },
            { attrKey: AttrKeyEnum.RTOInPressure, showName: "进气压力", showUnit: "kPa" },
            { attrKey: AttrKeyEnum.RTOInTemp, showName: "进气温度", showUnit: "℃" },
            { attrKey: AttrKeyEnum.RTOInConc, showName: "进气浓度", showUnit: "mg/m³" },
            { attrKey: AttrKeyEnum.CombustionTemp, showName: "焚烧炉温", showUnit: "℃" },
        ]
    },
    [ModelPartEnum.Outlet]: {
        title: "气体排放口",
        linkedData: [
            { attrKey: AttrKeyEnum.RTOOutTemp, showName: "排气温度", showUnit: "℃" },
            { attrKey: AttrKeyEnum.RTOOutConc, showName: "排气浓度", showUnit: "mg/m³" },
        ]
    }
}
