import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei'
import { FloatingTag } from './ModelItems'
import { FloorPlane } from "./FloorPlane"
import { ProdLineBody } from "./ProdLineBody"
export function ModelView() {
    return (
        // 1. 使用 Tailwind 打造全屏 3D 画布容器 (relative + full w/h)
        <div className="absolute top-0 left-0 w-screen h-screen bg-theme-6 overflow-hidden">
            {/* 2. 3D 画布 */}
            <Canvas shadows>
                <ProdLineBody />
                {/* <FloorPlane /> */}
                <Html
                    transform
                    position={[-4, 0, 0]}>
                    <FloatingTag />
                </Html>
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
                <OrbitControls />
            </Canvas>
        </div>
    )
}