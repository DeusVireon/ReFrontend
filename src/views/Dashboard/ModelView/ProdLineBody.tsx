import React, { useEffect, useMemo, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import { type ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useModelViewStateStore } from '../stores/ModelViewState';
import { createBreathingCoverMaterial, createFresnelMaterial } from './MaterialUtils';
import { ModelPartEnum } from '../models/ModelPartEnum';

const SELECTION_COLOR = "#7290fa";
const WARNING_COLOR = '#f73d62';

const MODEL_GROUP_ANCHOR_MAP: Record<string, ModelPartEnum> = {
    'shell_rotor': ModelPartEnum.Rotor,
    'shell_desorption_fan': ModelPartEnum.DesorptionFan,
    'shell_absorption_fan': ModelPartEnum.AdsorptionFan,
    'shell_conbustion_chamber': ModelPartEnum.CombustionChamber,
    'concentrated_pipe_cylinder2002': ModelPartEnum.Concentrated,
    'shell_inlet': ModelPartEnum.Inlet,
    'outlet_guardrail_torus': ModelPartEnum.Outlet
}

export function ProdLineBody() {
    const { scene } = useGLTF('/ProdLineMain.glb');

    // 订阅 Zustand 状态与 Action
    const activeGroup = useModelViewStateStore((state) => state.selectedGroup);
    const toggleGroupAct = useModelViewStateStore((state) => state.toggleSelection);
    const setActiveGroupAct = useModelViewStateStore((state) => state.selectGroup);

    // 创建 Shader 材质
    const selectionMat = useMemo(() => {
        return createFresnelMaterial({
            color: SELECTION_COLOR,
            power: 0.6,
            intensity: 0.6,
        });
    }, []);

    const warningMat = useMemo(() => {
        return createBreathingCoverMaterial({
            color: WARNING_COLOR,
            speed: 10.0,
            minOpacity: 0.1,
            maxOpacity: 0.2,
        });
    }, []);

    // 帧更新时应用 Shader 材质动画
    useFrame((state) => {
        const uT = warningMat.uniforms.uTime;
        if (uT) uT.value = state.clock.getElapsedTime();
    });

    // 模型场景变更时进行初始化
    useEffect(() => {
        if (scene) {
            initializeModelMaterials(scene);
        }
    }, [scene]);

    useEffect(() => {
        if (!scene) return;

        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                // mesh.castShadow = true;
                // mesh.receiveShadow = true;
                if (!mesh.userData.isInitialized) return;
                // const mat = mesh.material as THREE.MeshStandardMaterial;
                const meshPrefix = getGroupPrefix(mesh.name);

                // 判断当前 Mesh 是否属于被激活的部件组
                const isSelected = meshPrefix !== null && meshPrefix === activeGroup;
                if (isSelected) {
                    toggleSelectionHighlight(mesh, selectionMat, true);
                    setMeshBoundingBox(mesh, true, SELECTION_COLOR);
                } else {
                    toggleSelectionHighlight(mesh, selectionMat, false);
                    setMeshBoundingBox(mesh, false);
                }
            }
        });
    }, [activeGroup, scene]);

    const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {

        const clickedMesh = e.object as THREE.Mesh;
        if (!clickedMesh.isMesh) return;

        // 解析点击到的前缀
        const prefix = getGroupPrefix(clickedMesh.name);

        if (prefix) {
            // 匹配到有效组 -> 切换 Zustand 状态
            toggleGroupAct(prefix);
            e.stopPropagation(); // 中断事件传递
        } else {
            // 点击了地面、背景或未标记部件 -> 清空高亮
            setActiveGroupAct(null);
        }
    }, [toggleGroupAct, setActiveGroupAct]);

    return <primitive object={scene} onClick={handleClick} />;
}

function initializeModelMaterials(scene: THREE.Group) {
    const anchors: Partial<Record<ModelPartEnum, THREE.Vector3>> = {};
    const gasFlowCurves: Partial<Record<string, THREE.Curve<THREE.Vector3>>> = {};
    scene.traverse((child) => {
        // 处理 Mesh 初始化
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (!mesh.userData.isInitialized) {
                if (!Array.isArray(mesh.material)) {
                    // 克隆材质，防止同材质部件相互干扰
                    mesh.material = mesh.material.clone();
                    const mat = mesh.material as THREE.MeshStandardMaterial;

                    // 将原始物理属性备份到 userData *备用
                    mesh.userData.originalColor = mat.color.clone();
                    mesh.userData.originalEmissive = mat.emissive ? mat.emissive.clone() : new THREE.Color(0, 0, 0);
                    mesh.userData.originalEmissiveIntensity = mat.emissiveIntensity || 0;
                }
                mesh.userData.isInitialized = true;
            }
            // 提取位置锚点
            const matchedKey = Object.keys(MODEL_GROUP_ANCHOR_MAP).find(key => mesh.name.includes(key));
            if (matchedKey) {
                const partEnum = MODEL_GROUP_ANCHOR_MAP[matchedKey];
                if (!partEnum) return;
                // 计算当前 Mesh 在世界坐标系下的真实几何中心点
                const box = new THREE.Box3().setFromObject(mesh);
                const centerPosition = new THREE.Vector3();
                box.getCenter(centerPosition);
                anchors[partEnum] = centerPosition;
            }
        }
        // 处理 Line 初始化
        if ((child as THREE.Line).isLine && child.name.startsWith('curve_')) {
            const line = child as THREE.Line;
            const positionAttr = line.geometry.attributes.position;

            if (positionAttr && positionAttr.count >= 2) {
                const points: THREE.Vector3[] = [];
                // 提取坐标（应用节点本身的变换矩阵）
                for (let i = 0; i < positionAttr.count; i++) {
                    const p = new THREE.Vector3().fromBufferAttribute(positionAttr, i);
                    p.applyMatrix4(line.matrixWorld); // 转为 Scene 根节点下的坐标
                    points.push(p);
                }
                // 折线 CurvePath
                // const curvePath = new THREE.CurvePath<THREE.Vector3>();
                // for (let i = 0; i < points.length - 1; i++) {
                //     curvePath.add(new THREE.LineCurve3(points[i], points[i + 1]));
                // }
                const curvePath = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.05);
                gasFlowCurves[line.name] = curvePath;
            }
        }
    });
    useModelViewStateStore.getState().setGeoAnchors(anchors as Record<ModelPartEnum, THREE.Vector3>);
    useModelViewStateStore.getState().setGasFlowPath(gasFlowCurves as Record<string, THREE.Curve<THREE.Vector3>>);
}

function getGroupPrefix(meshName: string): ModelPartEnum | null {
    const prefixes = Object.values(ModelPartEnum) as ModelPartEnum[];
    return prefixes.find(prefix => meshName.startsWith(prefix)) ?? null;
}

export function toggleSelectionHighlight(targetMesh: THREE.Mesh, material: THREE.Material, enable: boolean) {
    const HIGHLIGHT_NAME = '__highlight__selection__';
    const existingOutline = targetMesh.getObjectByName(HIGHLIGHT_NAME);

    if (!enable) {
        // 移除描边网格并释放内存
        if (existingOutline && existingOutline instanceof THREE.Mesh) {
            targetMesh.remove(existingOutline);
            existingOutline.geometry.dispose();
            (existingOutline.material as THREE.Material).dispose();
        }
        return;
    }

    if (existingOutline) return; // 已存在则跳过

    // 复用原几何体，挂载为子节点
    const fresnelMesh = new THREE.Mesh(targetMesh.geometry, material);
    fresnelMesh.name = HIGHLIGHT_NAME;

    targetMesh.add(fresnelMesh);
}

export function setMeshBoundingBox(targetMesh: THREE.Mesh, enable: boolean, color: string = "") {
    const HELPER_NAME = '__mesh_bounding_box__';
    const existingHelper = targetMesh.getObjectByName(HELPER_NAME);

    if (!enable) {
        // 移除包围盒线框并释放内存
        if (existingHelper) {
            targetMesh.remove(existingHelper);

            // Box3Helper 的 geometry 和 material 是内部独立创建的，需要释放
            if ('geometry' in existingHelper) {
                (existingHelper as THREE.LineSegments).geometry.dispose();
            }
            if ('material' in existingHelper) {
                const mat = (existingHelper as THREE.LineSegments).material;
                if (Array.isArray(mat)) {
                    mat.forEach((m) => m.dispose());
                } else {
                    mat.dispose();
                }
            }
        }
        return;
    }

    if (existingHelper) return; // 已存在则跳过

    // 1. 确保 geometry 已计算出局部包围盒 (Local AABB)
    if (!targetMesh.geometry.boundingBox) {
        targetMesh.geometry.computeBoundingBox();
    }

    const localBox = targetMesh.geometry.boundingBox;
    if (!localBox) return;

    // 2. 使用 Box3Helper 绑定局部包围盒，并作为子节点挂载
    const boxHelper = new THREE.Box3Helper(localBox, color);
    boxHelper.name = HELPER_NAME;

    targetMesh.add(boxHelper);
}