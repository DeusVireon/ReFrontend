import React, { useMemo, useState } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

interface SensorItem {
    id: string;
    name: string;
    mesh: THREE.Mesh;
    worldPosition: THREE.Vector3;
}

export function FactoryAutomationModel({ telemetryData }: { telemetryData: Record<string, any> }) {
    const { scene } = useGLTF('/models/complex_factory.glb');

    // 选中的节点状态
    const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);

    // 1. 根据前缀批量提取所有传感器节点
    const sensorList = useMemo(() => {
        const list: SensorItem[] = [];

        // 遍历整个场景树
        scene.traverse((child) => {
            // 检查节点是否是 Mesh，且名称以 "Sensor_" 开头
            if ((child as THREE.Mesh).isMesh && child.name.startsWith('Sensor_')) {
                const mesh = child as THREE.Mesh;

                // 计算该节点在 3D 世界中的绝对空间位置（解决层级嵌套导致的坐标偏移）
                const worldPos = new THREE.Vector3();
                mesh.getWorldPosition(worldPos);

                list.push({
                    id: mesh.uuid,
                    name: mesh.name, // 例如 "Sensor_Temperature_01"
                    mesh: mesh,
                    worldPosition: worldPos,
                });
            }
        });

        return list;
    }, [scene]);

    // 2. 批量处理点击交互（例如点击带 "Click_" 前缀的部件进行变色）
    const handleSceneClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const mesh = e.object as THREE.Mesh;

        // 如果击中的节点名字前缀为 "Click_"
        if (mesh.isMesh && mesh.name.startsWith('Click_')) {
            // 隔离材质
            if (!Array.isArray(mesh.material)) {
                mesh.material = mesh.material.clone();
                (mesh.material as THREE.MeshStandardMaterial).color.set('#00f0ff');
            }
        }
    };

    return (
        <group onClick={handleSceneClick}>
            {/* 渲染基础 GLB 模型场景 */}
            <primitive object={scene} />

            {/* 3. 根据提取到的 Sensor 节点数组，批量自动挂载数据标注 */}
            {sensorList.map((sensor) => {
                // 从外部实时数据源中根据节点名称匹配数据
                const data = telemetryData[sensor.name] || { temp: '25.0', status: 'NORMAL' };
                const isSelected = selectedSensorId === sensor.id;

                return (
                    <group key={sensor.id} position={sensor.worldPosition}>
                        {/* 在每个传感器节点的绝对坐标处放置 2D 数据标签 */}
                        <Html
                            center
                            distanceFactor={15}
                            occlude /* 被场景模型挡住时自动隐藏 */
                        >
                            <div
                                className={`tag-card ${isSelected ? 'active' : ''}`}
                                onClick={() => setSelectedSensorId(sensor.id)}
                                style={{
                                    background: 'rgba(10, 25, 47, 0.85)',
                                    border: isSelected ? '2px solid #00f0ff' : '1px solid #334155',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                }}
                            >
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{sensor.name}</div>
                                <div style={{ fontWeight: 'bold', color: '#00f0ff' }}>
                                    {data.temp} ℃
                                </div>
                            </div>
                        </Html>
                    </group>
                );
            })}
        </group>
    );
}