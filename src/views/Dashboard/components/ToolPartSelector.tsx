import React, { useState } from 'react';
import { Dam, Radius, ZodiacAquarius, Fan, Flame, Factory, type LucideIcon } from 'lucide-react';
import { useModelViewStateStore } from '../stores/ModelViewState';
import { ModelPartEnum } from '../models/ModelPartEnum';

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

export function VerticalToggleGroup() {
    const selectedId = useModelViewStateStore((state) => state.selectedGroup);
    const setActiveGroup = useModelViewStateStore((state) => state.selectGroup);

    return (
        <div className="relative flex-col inline-flex gap-0.5 p-1 \
            rounded-md bg-gray-2/50 text-text backdrop-blur-md shadow-2xl">
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
                                ? 'bg-accent/75 text-white scale-100'
                                : 'hover:text-white hover:bg-white/10 active:scale-95'
                            }`}
                    >
                        <Icon className="size-5 stroke-[2.2]" />
                    </button>
                );
            })}
        </div>
    );
}