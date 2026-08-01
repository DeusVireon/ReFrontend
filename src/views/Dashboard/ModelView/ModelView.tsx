import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useGLTF } from '@react-three/drei'
import { useEffect } from "react"
import * as THREE from 'three'
import { FloorPlane } from "./FloorPlane"
import { Model } from "./ProdLineMain"
export function ModelView() {
    return (
        // 1. 使用 Tailwind 打造全屏 3D 画布容器 (relative + full w/h)
        <div className="absolute top-0 left-0 w-screen h-screen bg-theme-4 overflow-hidden">
            {/* 2. 3D 画布 */}
            <Canvas>
                <Model position={[0, 5, 0]} />
                <FloorPlane />
                <axesHelper />
                <gridHelper />
                <ambientLight intensity={3.8} color="#ffffff" />
                <directionalLight position={[5, 5, 5]} intensity={3} color={"#a0a6dd"} />
                <PerspectiveCamera
                    position={[0, 20, 0]}
                    makeDefault
                    fov={75}
                    near={0.1}
                    far={1000}
                />
                <OrbitControls />
            </Canvas>
        </div>
    )
}