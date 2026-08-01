import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const InfiniteMetallicPlane: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // 1. 场景与雾效 (实现无限延展渐变)
        const scene = new THREE.Scene();
        const bgColor = new THREE.Color('#0b0f19'); // 图示深蓝灰背景色
        scene.background = bgColor;
        scene.fog = new THREE.FogExp2(bgColor, 0.007); // 指数雾，边缘融合

        // 2. 相机设置
        const camera = new THREE.PerspectiveCamera(
            45,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        // 设置为类似图示的视角（俯视与侧视角）
        camera.position.set(40, 30, 50);

        // 3. 渲染器设置 (开启 ACESFilmic 色彩映射以呈现金属高光)
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        container.appendChild(renderer.domElement);

        // 4. 轨道控制器
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.01; // 限制不能穿透地面
        controls.target.set(0, 0, 0);

        // 5. 灯光布局 (打造亚金属质感与边缘光)
        // 环境光：基础暗蓝色调
        const ambientLight = new THREE.AmbientLight('#ffffff', 1.0);
        scene.add(ambientLight);

        // 主平行光：冷蓝金属高光
        const mainDirLight = new THREE.DirectionalLight('#8bb2e5', 10);
        mainDirLight.position.set(0, 100, 0);
        scene.add(mainDirLight);

        // 6. 动态生成抗锯齿正方形网格 Canvas 纹理
        const createGridTexture = (): THREE.CanvasTexture => {
            const textureSize = 256;
            const canvas = document.createElement('canvas');
            canvas.width = textureSize;
            canvas.height = textureSize;
            const ctx = canvas.getContext('2d')!;

            // 亚金属底色
            ctx.fillStyle = '#101622';
            ctx.fillRect(0, 0, textureSize, textureSize);

            // 外围正方形分割线 (亮蓝灰细线)
            ctx.strokeStyle = '#2e456b';
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, textureSize, textureSize);

            // 内侧微弱双线细节 (增强工业科技感)
            ctx.strokeStyle = 'rgba(65, 100, 150, 0.3)';
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, textureSize - 4, textureSize - 4);

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;

            // 重复铺满，控制网格密度
            const repeatCount = 120;
            texture.repeat.set(repeatCount, repeatCount);

            // 开启最大各向异性过滤，防止远景网格模糊或产生摩尔纹
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;

            return texture;
        };

        const gridTexture = createGridTexture();

        // 7. 亚金属材质 (MeshStandardMaterial)
        const planeMaterial = new THREE.MeshStandardMaterial({
            map: gridTexture,
            metalness: 0.8, // 高金属度
            roughness: 0.5, // 中等粗糙度 -> 呈现磨砂/无光泽亚金属效果
            bumpMap: gridTexture, // 给予分割线微小的凹凸质感
            bumpScale: 0.01,
        });

        // 8. 铺设大面积平面 (配合 Fog 实现视觉无限)
        const planeGeometry = new THREE.PlaneGeometry(2000, 2000, 1, 1);
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        planeMesh.rotation.x = -Math.PI / 2; // 水平放置
        planeMesh.position.y = 0;
        scene.add(planeMesh);

        // 9. 窗口 Resize 响应
        const handleResize = () => {
            if (!container) return;
            const width = container.clientWidth;
            const height = container.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        };

        window.addEventListener('resize', handleResize);

        // 10. 渲染循环
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // 11. 资源清理
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);

            controls.dispose();
            planeGeometry.dispose();
            planeMaterial.dispose();
            gridTexture.dispose();
            renderer.dispose();

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div className="relative w-full h-screen bg-[#273558] overflow-hidden">
            {/* Three.js 挂载容器 */}
            <div ref={containerRef} className="w-full h-full" />

            {/* 可选：顶部 UI 悬浮提示层 */}
            <div className="absolute top-4 left-4 pointer-events-none text-slate-400 text-xs tracking-wider uppercase bg-slate-900/40 backdrop-blur px-3 py-1.5 rounded border border-slate-700/50">
                Sub-Metallic Grid Floor Render
            </div>
        </div>
    );
};

export default InfiniteMetallicPlane;