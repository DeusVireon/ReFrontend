import { ContactShadows } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const TEXTURE_SIZE = 512;
const FLOOR_REPEAT = 128;
const FLOOR_NORMAL_SCALE = new THREE.Vector2(0.62, 0.62);

type FloorTextureSet = {
    albedo: THREE.CanvasTexture;
    height: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
};

function deterministicNoise(x: number, y: number) {
    const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return value - Math.floor(value);
}

function smoothStep(edge0: number, edge1: number, value: number) {
    const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

function createCanvasTexture(
    imageData: ImageData,
    colorSpace: THREE.ColorSpace,
    anisotropy: number,
    name: string,
) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d')!.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.name = name;
    texture.colorSpace = colorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(FLOOR_REPEAT, FLOOR_REPEAT);
    texture.anisotropy = anisotropy;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
}

function createIndustrialFloorTextures(anisotropy: number): FloorTextureSet {
    const size = TEXTURE_SIZE;
    const heightField = new Float32Array(size * size);
    const albedoData = new Uint8ClampedArray(size * size * 4);
    const heightData = new Uint8ClampedArray(size * size * 4);
    const roughnessData = new Uint8ClampedArray(size * size * 4);
    const normalData = new Uint8ClampedArray(size * size * 4);

    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const index = y * size + x;
            const pixel = index * 4;
            const edgeDistance = Math.min(x, y, size - 1 - x, size - 1 - y);
            const seam = 1 - smoothStep(2, 8, edgeDistance);
            const bevel = smoothStep(6, 13, edgeDistance) * (1 - smoothStep(13, 21, edgeDistance));

            // Alternating raised lozenges reproduce anti-slip checker plate without image assets.
            const cell = 40;
            const cellX = Math.floor(x / cell);
            const cellY = Math.floor(y / cell);
            const localX = (x % cell) - cell / 2;
            const localY = (y % cell) - cell / 2;
            const direction = (cellX + cellY) % 2 === 0 ? 1 : -1;
            const rotatedX = (localX + direction * localY) * Math.SQRT1_2;
            const rotatedY = (localY - direction * localX) * Math.SQRT1_2;
            const lozengeDistance = Math.abs(rotatedX) / 13 + Math.abs(rotatedY) / 2.7;
            // const tread = 1 - smoothStep(0.72, 1, lozengeDistance);
            const tread = 0 // 关闭防滑纹效果


            // Four shallow fasteners make the repeated tile read as a manufactured panel.
            const fastenerDistance = Math.min(
                Math.hypot(x - 19, y - 19),
                Math.hypot(x - (size - 19), y - 19),
                Math.hypot(x - 19, y - (size - 19)),
                Math.hypot(x - (size - 19), y - (size - 19)),
            );
            const fastener = 1 - smoothStep(4.5, 7.5, fastenerDistance);

            const grain = deterministicNoise(x, y) - 0.5;
            const brushed = Math.sin(y * 1.8) * 0.5 + Math.sin(y * 0.19) * 0.5;
            const lowFrequency = Math.sin(x * 0.035) * Math.sin(y * 0.027);
            const height = grain * 0.025 + tread * 0.48 + fastener * 0.24 + bevel * 0.08 - seam * 0.7;
            heightField[index] = height;

            const wear = tread * 13 + fastener * 8;
            const base = 140 + grain * 12 + brushed * 3 + lowFrequency * 2; // 基础亮度
            const seamDarkening = seam * 31;
            albedoData[pixel] = THREE.MathUtils.clamp(base + wear - seamDarkening + 10, 0, 255); // R
            albedoData[pixel + 1] = THREE.MathUtils.clamp(base + wear - seamDarkening + 5, 0, 255); // G
            albedoData[pixel + 2] = THREE.MathUtils.clamp(base + wear - seamDarkening + 20, 0, 255); // B
            albedoData[pixel + 3] = 255;

            const heightValue = THREE.MathUtils.clamp(128 + height * 112, 0, 255);
            heightData[pixel] = heightValue;
            heightData[pixel + 1] = heightValue;
            heightData[pixel + 2] = heightValue;
            heightData[pixel + 3] = 255;

            // Raised areas are polished by traffic; recessed seams retain a rougher finish.
            const roughness = THREE.MathUtils.clamp(161 + grain * 20 + seam * 46 - tread * 37 - fastener * 20, 0, 255);
            roughnessData[pixel] = roughness;
            roughnessData[pixel + 1] = roughness;
            roughnessData[pixel + 2] = roughness;
            roughnessData[pixel + 3] = 255;
        }
    }

    // Convert the scalar height field to a tangent-space normal map using central differences.
    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const left = heightField[y * size + ((x - 1 + size) % size)]!;
            const right = heightField[y * size + ((x + 1) % size)]!;
            const down = heightField[((y - 1 + size) % size) * size + x]!;
            const up = heightField[((y + 1) % size) * size + x]!;
            const normalX = (left - right) * 2.6;
            const normalY = (down - up) * 2.6;
            const inverseLength = 1 / Math.sqrt(normalX * normalX + normalY * normalY + 1);
            const pixel = (y * size + x) * 4;
            normalData[pixel] = (normalX * inverseLength * 0.5 + 0.5) * 255;
            normalData[pixel + 1] = (normalY * inverseLength * 0.5 + 0.5) * 255;
            normalData[pixel + 2] = (inverseLength * 0.5 + 0.5) * 255;
            normalData[pixel + 3] = 255;
        }
    }

    return {
        albedo: createCanvasTexture(
            new ImageData(albedoData, size, size),
            THREE.SRGBColorSpace,
            anisotropy,
            'industrial-floor-albedo',
        ),
        height: createCanvasTexture(
            new ImageData(heightData, size, size),
            THREE.NoColorSpace,
            anisotropy,
            'industrial-floor-height',
        ),
        normal: createCanvasTexture(
            new ImageData(normalData, size, size),
            THREE.NoColorSpace,
            anisotropy,
            'industrial-floor-normal',
        ),
        roughness: createCanvasTexture(
            new ImageData(roughnessData, size, size),
            THREE.NoColorSpace,
            anisotropy,
            'industrial-floor-roughness',
        ),
    };
}

export function FloorPlane() {
    const gl = useThree((state) => state.gl);
    const textures = useMemo(
        () => createIndustrialFloorTextures(gl.capabilities.getMaxAnisotropy()),
        [gl],
    );

    useEffect(() => () => {
        Object.values(textures).forEach((texture) => texture.dispose());
    }, [textures]);

    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[1536, 1536]} />
                <meshStandardMaterial
                    map={textures.albedo}
                    bumpMap={textures.height}
                    bumpScale={0.055}
                    normalMap={textures.normal}
                    normalScale={FLOOR_NORMAL_SCALE}
                    roughness={0.62}
                    roughnessMap={textures.roughness}
                    metalness={0.82}
                    envMapIntensity={0.72}
                    color="#aeb4b8"
                />
            </mesh>
            <ContactShadows
                position={[0, 0.018, 0]}
                scale={72}
                opacity={0.34}
                blur={2.2}
                far={14}
                resolution={512}
                frames={2}
                color="#05070a"
            />
        </>
    );
}
