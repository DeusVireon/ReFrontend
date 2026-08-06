import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei'
import { FloatingDataBoard } from './ModelItems'
import { FloorPlane } from "./FloorPlane"
import { ProdLineBody } from "./ProdLineBody"
import { useModelViewStateStore } from '../stores/ModelViewState';
import { GasFlowLine } from './GasFlow';
import * as THREE from 'three';
export function ModelView() {
    return (
        // 1. 使用 Tailwind 打造全屏 3D 画布容器 (relative + full w/h)
        <div className="absolute top-0 left-0 w-screen h-screen bg-theme-6 overflow-hidden">
            {/* 2. 3D 画布 */}
            <Canvas shadows>
                <ProdLineBody />
                {/* <FloorPlane /> */}
                <FloatingBoardEle />
                <axesHelper />
                <gridHelper />
                <ambientLight intensity={3.6} color="#ffffff" />
                <directionalLight position={[0, 5, 20]} intensity={5} color={"#a0a6dd"} />
                <PerspectiveCamera
                    position={[0, 20, 0]}
                    makeDefault
                    fov={75}
                    near={0.1}
                    far={1000}
                />
                <GasFlowLine
                    glbPath="/ProdLineMain.glb"
                    lineName="curve_rotor_absorption_fan"
                    tubeRadius={0.3}
                    color="#b5a63e"
                />
                <GasFlowLine
                    glbPath="/ProdLineMain.glb"
                    lineName="curve_rotor_absorption_fan"
                    tubeRadius={0.15}
                    color="#b5a63e"
                />
                <OrbitControls />
            </Canvas>
        </div>
    )
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