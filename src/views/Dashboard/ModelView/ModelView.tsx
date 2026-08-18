import { Canvas } from "@react-three/fiber"
import { CameraControls, PerspectiveCamera, Html } from '@react-three/drei'
import { FloatingDataBoard } from './ModelItems'
import { FloorPlane } from "./FloorPlane"
import { ProdLineBody } from "./ProdLineBody"
import { useModelViewStateStore } from '../stores/ModelViewState';
import { GasFlowLine } from './GasFlow';
import * as THREE from 'three';
import { CameraController } from './CameraController';
export function ModelView() {
    return (
        // 1. 使用 Tailwind 打造全屏 3D 画布容器 (relative + full w/h)
        <div className="absolute top-0 left-0 w-screen h-screen overflow-hidden">
            {/* 2. 3D 画布 */}
            <Canvas shadows>
                <ProdLineBody />
                <fogExp2 attach="fog" args={["#a0a6dd", 0.0025]} />
                <FloorPlane />
                <FloatingBoardEle />
                <axesHelper />
                <gridHelper />
                <ambientLight intensity={4} color="#ffffff" />
                <directionalLight position={[30, 10, 30]} intensity={7} color={"#a0a6dd"} />
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