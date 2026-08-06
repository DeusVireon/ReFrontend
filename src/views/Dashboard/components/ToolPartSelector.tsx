import React, { useState, useEffect } from 'react';
import {
    Dam, Radius, ZodiacAquarius,
    Fan, Flame, Factory,
    ScanBox, Rotate3d, SquareCode,
    SearchAlert, RotateCwSquare, type LucideIcon
} from 'lucide-react';
import { useModelViewStateStore } from '../stores/ModelViewState';
import { ModelPartEnum } from '../models/ModelPartEnum';
import { CamControlMode } from '../stores/ModelViewState';

interface ToggleOption {
    id: ModelPartEnum;
    label: string;
    icon: LucideIcon;
}

const options: ToggleOption[] = [
    { id: ModelPartEnum.Inlet, label: '气体输入', icon: Dam },
    { id: ModelPartEnum.Rotor, label: '循环转轮', icon: Radius },
    { id: ModelPartEnum.Concentrated, label: '浓缩气体通路', icon: ZodiacAquarius },
    { id: ModelPartEnum.DesorptionFan, label: '解吸风机', icon: Fan },
    { id: ModelPartEnum.CombustionChamber, label: '焚烧炉', icon: Flame },
    { id: ModelPartEnum.Outlet, label: '气体排放', icon: Factory },
];

interface CamControlModeBtnProps {
    style: string;
    icon: LucideIcon;
    label: string;
}

const CAM_CONTROL_BTN_CONFIG: Record<CamControlMode, CamControlModeBtnProps> = {
    [CamControlMode.Focus]: { style: "bg-accent/75", icon: ScanBox, label: '控制：聚焦模式' },
    [CamControlMode.Free]: { style: "bg-accent-purple/75", icon: Rotate3d, label: '控制：自由视角模式' },
    [CamControlMode.Carousel]: { style: "bg-theme-7/75", icon: RotateCwSquare, label: '控制：自动轮播模式' },
    [CamControlMode.FullView]: { style: "", icon: SquareCode, label: '控制：全景视角模式' },
    [CamControlMode.Attention]: { style: "bg-attention/75", icon: SearchAlert, label: '控制：关注模式' },
};

export function VerticalToggleGroup() {
    const selectedId = useModelViewStateStore((state) => state.selectedGroup);
    const camControlMode = useModelViewStateStore((state) => state.camControlMode);
    const camCtrlBtn = CAM_CONTROL_BTN_CONFIG[camControlMode] ?? { style: "", icon: ScanBox, label: '视角控制模式' };
    const setActiveGroup = useModelViewStateStore((state) => state.selectGroup);
    const setCamControlMode = useModelViewStateStore((state) => state.setCamControlMode);

    return (
        <div className="relative flex-col inline-flex gap-0.5 p-1 \
            rounded-md bg-gray-2/50 text-text backdrop-blur-md shadow-2xl">
            {/*控制模式选择器*/}
            <button
                key={"camera-control-mode"}
                onClick={() => onCamControlBtnClicked(camControlMode, setCamControlMode, setActiveGroup)}
                title={camCtrlBtn.label}
                aria-label={camCtrlBtn.label}
                className={`relative flex items-center justify-center size-10 rounded-md \
                            transition-all duration-200
                            ${camCtrlBtn.style}`}>
                <camCtrlBtn.icon className="size-5 stroke-[2.2]" />
            </button>
            <div className="p-1"><div className="h-0.5 w-full bg-gray-7/50" /></div>
            {/*聚焦选择器*/}
            {options.map((option) => {
                const Icon = option.icon;
                const isActive = selectedId === option.id;
                return (
                    <button
                        key={option.id}
                        onClick={() => setActiveGroup(option.id)}
                        title={option.label}
                        aria-label={option.label}
                        className={`
                            relative flex items-center justify-center size-10 rounded-md \
                            transition-all duration-200
                            ${isActive
                                ? 'bg-accent/75'
                                : 'hover:text-white hover:bg-white/10 active:scale-95'
                            }`}>
                        <Icon className="size-5 stroke-[2.2]" />
                    </button>
                );
            })}
        </div>
    );
}

function onCamControlBtnClicked(currentMode: CamControlMode,
    setCamControlMode: (mode: CamControlMode) => void,
    setActiveGroup: (prefix: ModelPartEnum | null) => void) {
    console.log('Current camera control mode:', currentMode);

    switch (currentMode) {
        case CamControlMode.FullView:
            setCamControlMode(CamControlMode.Carousel);
            break;
        default:
            setCamControlMode(CamControlMode.FullView);
            setActiveGroup(null);
    }
}