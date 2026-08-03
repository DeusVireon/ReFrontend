import React, { useRef, useState } from 'react'
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Plane from './PlaneTest'
import * as THREE from 'three'

// 1. 定义组件 Props 类型（直接继承 3D 网格元素的类型）
type RotatingBoxProps = ThreeElements['mesh']

function RotatingBox(props: RotatingBoxProps) {
    // 2. 为 useRef 显式指定泛型为 THREE.Mesh，并初始化为 null!
    const meshRef = useRef<THREE.Mesh>(null!)

    const [hovered, setHover] = useState(false)
    const [active, setActive] = useState(false)

    // useFrame((_state, delta) => {
    //     // 此时 meshRef.current 正确推导为 THREE.Mesh 类型，支持 .rotation 属性
    //     if (meshRef.current) {
    //         meshRef.current.rotation.x += delta * 0.5
    //         meshRef.current.rotation.y += delta
    //     }
    // })

    return (
        <mesh
            {...props}
            ref={meshRef}
            scale={active ? 1.5 : 1}
            onClick={() => setActive(!active)}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={hovered ? '#8689a9' : '#8689a9'} />
        </mesh>
    )
}

export function ModelView() {
    return (
        // 1. 使用 Tailwind 打造全屏 3D 画布容器 (relative + full w/h)
        <div className="absolute top-0 left-0 w-screen h-screen bg-theme-4 overflow-hidden">

            {/* 2. 3D 画布 */}
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <RotatingBox position={[0, 0, 0]} />
                <OrbitControls />
            </Canvas>

        </div>
    )
}