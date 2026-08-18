import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useModelViewStateStore } from '../stores/ModelViewState';
import { CamControlMode } from '../stores/ModelViewState';

export function CameraController() {
    const curCamControlMode = useModelViewStateStore((state) => state.camControlMode);
    const activeGroup = useModelViewStateStore((state) => state.selectedGroup);
    const geoAnchor = useModelViewStateStore((state) => {
        if (!state.geoAnchors || !activeGroup) return null;
        return state.geoAnchors[activeGroup];
    });
    const cameraControlsRef = useRef(null as CameraControls | null);

    // 当 Zustand 状态改变时，驱动 CameraControls 平滑过渡
    useEffect(() => {
        const modelVisualOffsetX = -5
        const controls = cameraControlsRef.current
        let camX = modelVisualOffsetX
        let camY = 7;
        let camZ = -14;
        let tarX = modelVisualOffsetX
        let tarY = 4;
        let tarZ = 0;

        if (!controls) return

        if (curCamControlMode === CamControlMode.FullView) {
            camX = modelVisualOffsetX - 2;
            camZ = -16;
            tarX = modelVisualOffsetX - 2;
        }
        // 移动到新位置并注视目标点，启用平滑过渡 (true)
        if ((curCamControlMode === CamControlMode.Focus ||
            curCamControlMode === CamControlMode.Carousel)
            && geoAnchor) {
            camX = geoAnchor.x / 3 + modelVisualOffsetX;
            camY = 7;
            camZ = -14;
            tarX = geoAnchor.x;
            tarY = geoAnchor.y - 1;
            tarZ = geoAnchor.z;
        }
        // 计算终点相对于目标的方位角 (atan2(dx, dz))
        const dx = camX - tarX;
        const dz = camZ - tarZ;
        const targetAzimuth = Math.atan2(dx, dz);
        // 判断角度差，强制修正起点方位角，确保走 < 180 度的最短路径
        // 如果不设置此步骤，在 -180° 到 +180° 的边界附近，可能会出现绕圈的情况
        const currentAzimuth = controls.azimuthAngle;
        const delta = targetAzimuth - currentAzimuth;
        if (delta > Math.PI) {
            controls.azimuthAngle += Math.PI * 2;
        } else if (delta < -Math.PI) {
            controls.azimuthAngle -= Math.PI * 2;
        }
        controls.setLookAt(
            camX, camY, camZ,
            tarX, tarY, tarZ,
            true
        )
    }, [geoAnchor, curCamControlMode])

    return (
        <>
            <CameraControls
                ref={cameraControlsRef}
                smoothTime={0.8}
                truckSpeed={1}
                dollySpeed={1}
            />
            <AutoCameraTour controlsRef={cameraControlsRef} />
        </>

    )
}

export function AutoCameraTour({ controlsRef }: { controlsRef: React.RefObject<CameraControls | null> }) {
    const curCamControlMode = useModelViewStateStore((state) => state.camControlMode);
    const setCamControlMode = useModelViewStateStore((state) => state.setCamControlMode);
    const selectNextGroup = useModelViewStateStore((state) => state.selectNextGroup);
    const resumeTimerRef = useRef<number | null>(null)

    useEffect(() => {
        if (controlsRef === null) return
        const controls = controlsRef.current
        if (!controls) return

        // 用户开始手动控制 -> 暂停轮询并清除恢复定时器
        const handleControlStart = () => {
            setCamControlMode(CamControlMode.Free)
            if (resumeTimerRef.current) {
                clearTimeout(resumeTimerRef.current)
            }
        }

        // 镜头完全静止（无论用户松开手还是动画结束）
        const handleRest = () => {
            // 在自由模式或聚焦模式下开启延迟恢复定时器
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
            if (curCamControlMode === CamControlMode.Free || curCamControlMode === CamControlMode.Focus) {
                resumeTimerRef.current = setTimeout(() => {
                    setCamControlMode(CamControlMode.Carousel)
                }, 30000)
            }
        }

        controls.addEventListener('controlstart', handleControlStart)
        controls.addEventListener('rest', handleRest)

        return () => {
            controls.removeEventListener('controlstart', handleControlStart)
            controls.removeEventListener('rest', handleRest)
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
        }
    }, [controlsRef, curCamControlMode])

    // 轮询播放逻辑
    useEffect(() => {
        if (curCamControlMode !== CamControlMode.Carousel) return

        const timer = setInterval(() => {
            selectNextGroup()
        }, 10000)

        return () => clearInterval(timer)
    }, [curCamControlMode])

    return null
}