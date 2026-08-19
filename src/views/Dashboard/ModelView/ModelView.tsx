import { Canvas, useThree } from "@react-three/fiber"
import { Environment, Html, Lightformer, PerspectiveCamera } from '@react-three/drei'
import { FloatingDataBoard } from './ModelItems'
import { FloorPlane } from "./FloorPlane"
import { ProdLineBody } from "./ProdLineBody"
import { useModelViewStateStore } from '../stores/ModelViewState';
import { GasFlowLine } from './GasFlow';
import * as THREE from 'three';
import { CameraController } from './CameraController';
import { FactoryFloorOutline } from './FactoryFloorOutline';
import type { DashboardTheme } from '../theme';
import { useEffect } from 'react';

export function ModelView({ theme }: { theme: DashboardTheme }) {
    const isLight = theme === "light"

    return (
        // 1. 使用 Tailwind 打造全屏 3D 画布容器 (relative + full w/h)
        <div
            className="absolute top-0 left-0 w-screen h-screen overflow-hidden"
            style={{
                background: isLight
                    ? 'radial-gradient(ellipse at 50% 62%, #ffffff 0%, #edf3f8 48%, #dce7f0 100%)'
                    : 'radial-gradient(ellipse at 50% 68%, #172536 0%, #0b111c 48%, #05070d 100%)',
            }}
        >
            {/* 2. 3D 画布 */}
            <Canvas
                shadows
                dpr={[1, 1.5]}
                gl={{ antialias: true, powerPreference: 'high-performance' }}
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.toneMappingExposure = isLight ? 1.08 : 0.96;
                }}
            >
                <SceneRendererSettings exposure={isLight ? 1.08 : 0.96} />
                <fog attach="fog" args={isLight ? ["#e5edf4", 30, 82] : ["#0f1722", 24, 72]} />
                <FactoryFloorOutline theme={theme} />
                <ProdLineBody />
                <FloorPlane theme={theme} />
                <FloatingBoardEle />
                <hemisphereLight args={isLight
                    ? ["#ffffff", "#8799a8", 1.7]
                    : ["#9bbbd4", "#0b0f16", 0.92]}
                />
                <directionalLight
                    position={[18, 16, -10]}
                    intensity={isLight ? 4.2 : 3.1}
                    color={isLight ? "#fffdf8" : "#dceaff"}
                />
                <pointLight
                    position={[-18, isLight ? 8 : 7, -4]}
                    intensity={isLight ? 7 : 11}
                    distance={isLight ? 36 : 34}
                    color={isLight ? "#7fb6dc" : "#397fba"}
                />
                <Environment resolution={128} frames={1}>
                    <Lightformer
                        form="rect"
                        intensity={isLight ? 2.2 : 1.8}
                        color={isLight ? "#ffffff" : "#dcecff"}
                        position={[0, 10, -8]}
                        scale={[20, 5, 1]}
                        target={[0, 3, 0]}
                    />
                    <Lightformer
                        form="rect"
                        intensity={isLight ? 1.05 : 0.9}
                        color={isLight ? "#a9d1ea" : "#4088b8"}
                        position={[-12, 5, 4]}
                        scale={[5, 9, 1]}
                        target={[0, 3, 0]}
                    />
                </Environment>
                <PerspectiveCamera
                    position={[0, 20, 0]}
                    makeDefault
                    fov={75}
                    near={0.1}
                    far={1000}
                />
                <GasFlowLine />
                <CameraController />
            </Canvas>
        </div>
    )
}

function SceneRendererSettings({ exposure }: { exposure: number }) {
    const gl = useThree((state) => state.gl)

    useEffect(() => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = exposure
    }, [exposure, gl])

    return null
}

function FloatingBoardEle() {
    const activeGroup = useModelViewStateStore((state) => state.selectedGroup);
    const geoAnchor = useModelViewStateStore((state) => {
        if (!state.geoAnchors || !activeGroup) return null;
        return state.geoAnchors[activeGroup];
    });

    if (!activeGroup || !geoAnchor) return null;
    const targetPosition = geoAnchor.clone().add(new THREE.Vector3(0, 1, 0));

    return (
        <Html className="-translate-x-1/2 -translate-y-full"
            // transform
            position={targetPosition || [0, 8, 0]}>
            <FloatingDataBoard data={activeGroup} />
        </Html>
    )
}
