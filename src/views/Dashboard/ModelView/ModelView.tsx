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
            style={isLight ? {
                background: 'radial-gradient(ellipse at 50% 62%, #ffffff 0%, #edf3f8 48%, #dce7f0 100%)',
            } : undefined}
        >
            {/* 2. 3D 画布 */}
            <Canvas
                shadows
                dpr={[1, 1.5]}
                gl={{ antialias: true, powerPreference: 'high-performance' }}
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.toneMappingExposure = isLight ? 1.08 : 1;
                }}
            >
                <SceneRendererSettings exposure={isLight ? 1.08 : 1} />
                <fog attach="fog" args={isLight ? ["#e5edf4", 30, 82] : ["#1c1e2e", 300, 800]} />
                <FactoryFloorOutline theme={theme} />
                <ProdLineBody />
                <FloorPlane theme={theme} />
                <FloatingBoardEle />
                {isLight ? (
                    <>
                        <hemisphereLight args={["#ffffff", "#8799a8", 1.7]} />
                        <ambientLight intensity={2.2} color="#f4f8fb" />
                        <directionalLight position={[18, 16, -10]} intensity={4.2} color="#fffdf8" />
                        <directionalLight position={[-16, 10, -18]} intensity={2.4} color="#c8e0ef" />
                        <directionalLight position={[4, 8, 20]} intensity={1.8} color="#ffffff" />
                        <pointLight position={[-18, 8, -4]} intensity={7} distance={36} color="#7fb6dc" />
                        <Environment resolution={128} frames={1}>
                            <Lightformer
                                form="rect"
                                intensity={2.2}
                                color="#ffffff"
                                position={[0, 10, -8]}
                                scale={[20, 5, 1]}
                                target={[0, 3, 0]}
                            />
                            <Lightformer
                                form="rect"
                                intensity={1.05}
                                color="#a9d1ea"
                                position={[-12, 5, 4]}
                                scale={[5, 9, 1]}
                                target={[0, 3, 0]}
                            />
                        </Environment>
                    </>
                ) : (
                    <>
                        <ambientLight intensity={4} color="#ebedfc" />
                        <directionalLight position={[0, 25, 10]} intensity={2} color="#9298dc" />
                        <directionalLight position={[30, 10, -40]} intensity={5} color="#c5caf5" />
                        <directionalLight position={[-30, 10, -40]} intensity={5} color="#c5caf5" />
                    </>
                )}
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
