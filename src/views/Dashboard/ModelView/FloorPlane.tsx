import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function FloorPlane() {
    // 1. 通过 useThree 获取 renderer 实例 (对应原代码中的 renderer)
    const gl = useThree((state) => state.gl);

    // 2. 使用 useMemo 缓存 CanvasTexture，防止每次组件重新渲染时重复生成
    const gridTexture = useMemo(() => {
        const textureSize = 256;
        const canvas = document.createElement('canvas');
        canvas.width = textureSize;
        canvas.height = textureSize;
        const ctx = canvas.getContext('2d')!;

        // 亚金属底色
        ctx.fillStyle = '#5a5da3';
        ctx.fillRect(0, 0, textureSize, textureSize);

        // 外围正方形分割线 (亮蓝灰细线)
        ctx.strokeStyle = '#2e456b';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, textureSize, textureSize);

        // 内侧微弱双线细节 (增强工业科技感)
        ctx.strokeStyle = 'rgba(65, 100, 150, 0.3)';
        ctx.lineWidth = 4;
        ctx.strokeRect(1, 1, textureSize - 2, textureSize - 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        // 重复铺满，控制网格密度
        const repeatCount = 120;
        texture.repeat.set(repeatCount, repeatCount);

        // 开启最大各向异性过滤
        texture.anisotropy = gl.capabilities.getMaxAnisotropy();
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // 确保 CanvasTexture 正确提交给 GPU
        texture.needsUpdate = true;

        return texture;
    }, [gl]);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
            {/* 替换为你实际需要的几何体尺寸 */}
            <planeGeometry args={[1024, 1024]} />
            {/* <color attach="background" args={["#9cbff8"]} />
            <fogExp2 attach="fog" args={["#9cbff8", 0.07]} /> */}
            {/* 3. 声明式 R3F 亚金属材质 */}
            <meshStandardMaterial
                map={gridTexture}
                bumpMap={gridTexture}
                normalMap={gridTexture}
                bumpScale={0.1}
                metalness={0.5}
                roughness={0.5}
            />
        </mesh>
    );
}
