import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createFlowGasMaterial, createFluidGasMaterial } from './MaterialUtils';
import { useModelViewStateStore } from '../stores/ModelViewState';

enum GasShaderColor {
    RawFlow = '#a39e6a',
    RawFluidCore = '#c3c09b',
    RawFluidEdge = '#a5883e',
    ConFlow = '#c58548',
    ConFluidCore = '#e9be99',
    ConFluidEdge = '#e9a44f',
    CleanFlow = '#6881aa',
    CleanFluidCore = '#bed6fc',
    CleanFluidEdge = '#84b2fd',
}

interface GasFlowLineProps {
    flowColor?: GasShaderColor;
    fluidCoreColor?: GasShaderColor;
    fluidEdgeColor?: GasShaderColor;
    radius?: number;
    speed?: number;
    turbulence?: number;
    density?: number;
}

// name -> GasFlowLineProps
const GAS_PIPE_MAP: Record<string, GasFlowLineProps> = {
    "curve_inlet_rotor": {
        flowColor: GasShaderColor.RawFlow,
        fluidCoreColor: GasShaderColor.RawFluidCore,
        fluidEdgeColor: GasShaderColor.RawFluidEdge,
    },
    "curve_rotor_combustion_chamber": {
        flowColor: GasShaderColor.ConFlow,
        fluidCoreColor: GasShaderColor.ConFluidCore,
        fluidEdgeColor: GasShaderColor.ConFluidEdge,
    },
    "curve_rotor_absorption_fan": {
        flowColor: GasShaderColor.CleanFlow,
        fluidCoreColor: GasShaderColor.CleanFluidCore,
        fluidEdgeColor: GasShaderColor.CleanFluidEdge,
    },
    "curve_absorption_fan_outlet": {
        flowColor: GasShaderColor.CleanFlow,
        fluidCoreColor: GasShaderColor.CleanFluidCore,
        fluidEdgeColor: GasShaderColor.CleanFluidEdge,
    },
    "curve_combustion_chamber_outlet": {
        flowColor: GasShaderColor.CleanFlow,
        fluidCoreColor: GasShaderColor.CleanFluidCore,
        fluidEdgeColor: GasShaderColor.CleanFluidEdge,
    },
}

function GasFlowItem({
    curve,
    config,
}: {
    curve: THREE.Curve<THREE.Vector3>;
    config: GasFlowLineProps;
}) {
    const {
        flowColor = GasShaderColor.RawFlow,
        fluidCoreColor = GasShaderColor.RawFluidCore,
        fluidEdgeColor = GasShaderColor.RawFluidEdge,
        density = 0.2,
        turbulence = 0.05,
        radius = 0.3,
        speed = 0.2,
    } = config;

    const curveLength = curve.getLength();

    // 根据当前配置生成专属材质
    const flowGasMat = useMemo(
        () => createFlowGasMaterial({
            color: flowColor,
            density: density * curveLength,
        }),
        [flowColor]
    );

    const fluidGasMat = useMemo(
        () => {
            return createFluidGasMaterial({
                colorCore: fluidCoreColor,
                colorEdge: fluidEdgeColor,
                turbulence: turbulence * curveLength,
                speed: speed
            })
        },
        [fluidCoreColor, fluidEdgeColor, turbulence, speed]
    );



    // 独立更新动画帧，支持 speed 缩放
    useFrame((_, delta) => {
        if (flowGasMat.uniforms?.uTime) {
            flowGasMat.uniforms.uTime.value += delta;
        }
        if (fluidGasMat.uniforms?.uTime) {
            fluidGasMat.uniforms.uTime.value += delta;
        }
    });

    const innerRadius = radius * (0.2 / 0.3); // 按原例比例（0.3:0.2）计算内芯半径

    return (
        <group>
            <mesh material={flowGasMat}>
                <tubeGeometry args={[curve, 128, radius, 16, false]} />
            </mesh>
            <mesh material={fluidGasMat}>
                <tubeGeometry args={[curve, 128, innerRadius, 16, false]} />
            </mesh>
        </group>
    );
}

// 多段气体遍历渲染组件
export function GasFlowLine() {
    const gasFlowPath = useModelViewStateStore((state) => state.gasFlowPath);

    if (!gasFlowPath) return null;

    // 筛选 store 中存在且在 GAS_PIPE_MAP 中有配置的管道
    const activePipes = Object.entries(gasFlowPath).filter(
        ([name, curve]) => Boolean(curve) && name in GAS_PIPE_MAP
    );

    return (
        <group>
            {activePipes.map(([name, curve]) => {
                if (!GAS_PIPE_MAP[name]) {
                    return null;
                }
                return (
                    <GasFlowItem
                        key={name}
                        curve={curve}
                        config={GAS_PIPE_MAP[name]}
                    />
                )
            })}
        </group>
    );
}