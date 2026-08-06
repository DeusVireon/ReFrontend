import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useModelViewStateStore } from '../stores/ModelViewState';

export function CameraController() {

    const activeGroup = useModelViewStateStore((state) => state.selectedGroup);
    const geoAnchor = useModelViewStateStore((state) => {
        if (!state.geoAnchors || !activeGroup) return null;
        return state.geoAnchors[activeGroup];
    });
    const cameraControlsRef = useRef(null as CameraControls | null);

    // 当 Zustand 状态改变时，驱动 CameraControls 平滑过渡
    useEffect(() => {
        const controls = cameraControlsRef.current
        if (!controls) return

        // 移动到新位置并注视目标点，启用平滑过渡 (true)
        if (geoAnchor) {
            const camX = geoAnchor.x / 3 - 4;
            const camY = 8;
            const camZ = -14;

            // 计算终点相对于目标的方位角 (atan2(dx, dz))
            const dx = camX - geoAnchor.x;
            const dz = camZ - geoAnchor.z;
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
            console.log('Moving camera to', camX, camY, camZ, 'and looking at', geoAnchor.x, geoAnchor.y, geoAnchor.z);
            controls.setLookAt(
                camX, camY, camZ,
                geoAnchor.x, geoAnchor.y, 0,
                true
            )
        }
    }, [geoAnchor])

    return (
        <CameraControls
            ref={cameraControlsRef}
            smoothTime={0.5}
            truckSpeed={1}
            dollySpeed={1}
        />
    )
}