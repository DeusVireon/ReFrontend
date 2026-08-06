import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GasShaderMaterial } from './MaterialUtils';

// 1. 定义组件 Props 接口
interface GasFlowLineProps {
    glbPath: string;
    lineName: string;
    tubeRadius?: number;
    color?: string;
}

export function GasFlowLine({
    glbPath,
    lineName,
    tubeRadius = 0.2,
    color = '#00ffff',
}: GasFlowLineProps) {
    // 2. 类型断言解决 useGLTF 联合类型问题
    const { scene } = useGLTF(glbPath) as any;

    // 3. 为 useRef 指定 ShaderMaterial 泛型和初始值 null
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    // 4. 解析曲线
    const curve = useMemo(() => {
        // 显式声明 targetLine 类型，防止 TS 将其推导为 never
        let targetLine: THREE.Line | THREE.Mesh | null = null;

        scene.traverse((child: THREE.Object3D) => {
            if (child.name === lineName) {
                targetLine = child as THREE.Line | THREE.Mesh;
            }
        });

        if (!targetLine || !targetLine.geometry) {
            console.warn(`Line with name "${lineName}" not found in GLB.`);
            return null;
        }

        const positionAttribute = targetLine.geometry.attributes.position;
        if (!positionAttribute) return null;

        const points: THREE.Vector3[] = [];

        // 应用世界变换矩阵
        targetLine.updateMatrixWorld(true);
        const matrixWorld = targetLine.matrixWorld;

        for (let i = 0; i < positionAttribute.count; i++) {
            const p = new THREE.Vector3().fromBufferAttribute(positionAttribute, i);
            p.applyMatrix4(matrixWorld);
            points.push(p);
        }

        return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.1);
    }, [scene, lineName]);

    const uniforms = useMemo(
        () => THREE.UniformsUtils.clone(GasShaderMaterial.uniforms),
        []
    );

    useFrame((_, delta) => {
        if (materialRef.current && materialRef.current.uniforms?.uTime) {
            materialRef.current.uniforms.uTime.value += delta;
        }
    });

    if (!curve) return null;

    return (
        <mesh>
            <tubeGeometry args={[curve, 128, tubeRadius, 16, false]} />
            <shaderMaterial
                ref={materialRef}
                args={[
                    {
                        ...GasShaderMaterial,
                        uniforms,
                        transparent: true,
                        depthWrite: false,
                        blending: THREE.AdditiveBlending,
                        side: THREE.DoubleSide,
                    },
                ]}
                uniforms-uColor-value={new THREE.Color(color)}
            />
        </mesh>
    );
}