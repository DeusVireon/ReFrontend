import * as THREE from 'three';

// ==========================================
// 覆盖层材质 (Cover)
// ==========================================

export interface CoverMaterialProps {
  /** 材质颜色，支持 Hex 字符串或数字，默认 '#ffffff' */
  color?: string | number;
  /** 沿本地法线外扩的绝对厚度/距离，默认 0.01 */
  offset?: number;
  /** 不透明度 (0.0 - 1.0)，默认 0.2 */
  opacity?: number;
}

export function createCoverMaterial(options: CoverMaterialProps = {}) {
  const {
    color = '#ffffff',
    offset = 0.01,
    opacity = 0.2,
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOffset: { value: offset }, // 绝对增幅厚度
      uOpacity: { value: opacity },
    },
    vertexShader: `
      uniform float uOffset;
      
      void main() {
        // 关键逻辑：将顶点沿本地法线方向偏移绝对距离 uOffset
        vec3 extrudedPosition = position + normal * uOffset;
        
        // 转换到裁剪空间
        gl_Position = projectionMatrix * modelViewMatrix * vec4(extrudedPosition, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      
      void main() {
        gl_FragColor = vec4(uColor, uOpacity);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
  });
}

// ==========================================
// 带呼吸效果的覆盖层材质 (Cover)
// ==========================================

export interface BreathingCoverMaterialProps {
  /** 材质颜色，支持 Hex 字符串或数字，默认 '#ffffff' */
  color?: string | number;
  /** 沿本地法线外扩的绝对厚度/距离，默认 0.01 */
  offset?: number;
  /** 基础/最大不透明度 (0.0 - 1.0)，默认 0.4 */
  maxOpacity?: number;
  /** 呼吸谷值不透明度 (0.0 - 1.0)，默认 0.05 */
  minOpacity?: number;
  /** 呼吸频率 (rad/s)，数值越大呼吸越快，默认 2.5 */
  speed?: number;
}

export function createBreathingCoverMaterial(options: BreathingCoverMaterialProps = {}) {
  const {
    color = '#ffffff',
    offset = 0.01,
    maxOpacity = 0.4,
    minOpacity = 0.05,
    speed = 2.5,
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOffset: { value: offset },       // 绝对增幅厚度
      uTime: { value: 0 },              // 1. 时间累加器
      uSpeed: { value: speed },          // 2. 呼吸速度
      uMinOpacity: { value: minOpacity },// 3. 最小透明度
      uMaxOpacity: { value: maxOpacity },// 4. 最大透明度
    },
    vertexShader: `
      uniform float uOffset;
      
      void main() {
        // 关键逻辑：将顶点沿本地法线方向偏移绝对距离 uOffset
        vec3 extrudedPosition = position + normal * uOffset;
        
        // 转换到裁剪空间
        gl_Position = projectionMatrix * modelViewMatrix * vec4(extrudedPosition, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uMinOpacity;
      uniform float uMaxOpacity;
      
      void main() {
        // 1. 将 sin(t) 的 [-1, 1] 区间归一化映射到 [0.0, 1.0] 的平滑呼吸因子
        float breath = (sin(uTime * uSpeed) + 1.0) * 0.5;
        
        // 2. 在最小和最大透明度之间平滑插值
        float currentOpacity = mix(uMinOpacity, uMaxOpacity, breath);

        gl_FragColor = vec4(uColor, currentOpacity);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false, // 建议关闭深度写入，防止半透明外壳遮挡内部原 Mesh 的面
  });
}

// ==========================================
// 2. 菲涅尔边缘发光材质 (Fresnel Material)
// ==========================================

export interface FresnelMaterialProps {
  /** 边缘发光颜色，默认 '#00f0ff' */
  color?: string | number;
  /** 菲涅尔指数，指数越大发光边越窄 (推荐 2.0 - 5.0)，默认 3.0 */
  power?: number;
  /** 发光强度倍率，默认 1.5 */
  intensity?: number;
  /** 绝对法线外扩厚度 (避免 Z-fighting)，默认 0.01 */
  offset?: number;
}

export function createFresnelMaterial(options: FresnelMaterialProps = {}) {
  const {
    color = '#00f0ff',
    power = 3.0,
    intensity = 1.5,
    offset = 0.01,
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uPower: { value: power },
      uIntensity: { value: intensity },
      uOffset: { value: offset },
    },
    vertexShader: `
      uniform float uOffset;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;

      void main() {
        // 1. 将法线与位置转换到世界坐标系
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        
        // 2. 沿着法线方向稍微做微小绝对外扩，防止 Z-fighting
        worldPosition.xyz += vWorldNormal * uOffset;
        vWorldPosition = worldPosition.xyz;

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uIntensity;

      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;

      void main() {
        // 1. 计算归一化的世界法线与视线向量 (cameraPosition 是 Three.js 内置 Uniform)
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPosition);

        // 2. 核心菲涅尔公式计算
        float fresnel = 1.0 - clamp(dot(N, V), 0.0, 1.0);
        fresnel = pow(fresnel, uPower) * uIntensity;

        // 3. 输出 Alpha 通道与强度挂钩的发光颜色
        gl_FragColor = vec4(uColor * fresnel, fresnel);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending, // 关键：加色混合，实现辉光叠加效果
    depthWrite: false,                // 关闭深度写入，防止遮挡内部细节
    side: THREE.DoubleSide,            // 支持薄片/非闭合工业模型
  });
}

// ==========================================
// 3. 呼吸菲涅尔边缘发光材质 (Breathing Fresnel Material)
// ==========================================

export interface BreathingFresnelMaterialProps {
  /** 边缘发光颜色，默认 '#00f0ff' */
  color?: string | number;
  /** 菲涅尔指数，指数越大发光边越窄 (推荐 2.0 - 5.0)，默认 3.0 */
  power?: number;
  /** 绝对法线外扩厚度 (避免 Z-fighting)，默认 0.01 */
  offset?: number;
  /** 呼吸变换频率/速度 (rad/s)，默认 3.0 */
  speed?: number;
  /** 呼吸周期中的最低发光强度，默认 0.3 */
  minIntensity?: number;
  /** 呼吸周期中的最高发光强度，默认 2.2 */
  maxIntensity?: number;
}

export function createBreathingFresnelMaterial(options: BreathingFresnelMaterialProps = {}) {
  const {
    color = '#00f0ff',
    power = 3.0,
    offset = 0.01,
    speed = 3.0,
    minIntensity = 0.3,
    maxIntensity = 2.2,
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uPower: { value: power },
      uOffset: { value: offset },
      uTime: { value: 0 },            // 需在渲染循环 (requestAnimationFrame) 中递增更新：material.uniforms.uTime.value = clock.getElapsedTime();
      uSpeed: { value: speed },        // 呼吸频率
      uMinIntensity: { value: minIntensity }, // 最暗时的强度
      uMaxIntensity: { value: maxIntensity }, // 最亮时的强度
    },
    vertexShader: `
      uniform float uOffset;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;

      void main() {
        // 1. 计算世界坐标系下的法线与顶点位置
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        
        // 2. 沿着法线微小绝对外扩，避免 Z-fighting
        worldPosition.xyz += vWorldNormal * uOffset;
        vWorldPosition = worldPosition.xyz;

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uMinIntensity;
      uniform float uMaxIntensity;

      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;

      void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPosition);

        // 1. 利用正弦函数计算 [0.0, 1.0] 范围内的呼吸因子
        float breath = (sin(uTime * uSpeed) + 1.0) * 0.5;
        
        // 2. 在最低强度与最高强度之间进行动态线性插值
        float currentIntensity = mix(uMinIntensity, uMaxIntensity, breath);

        // 3. 计算带呼吸效果的菲涅尔发光强度
        float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), uPower) * currentIntensity;

        gl_FragColor = vec4(uColor * fresnel, fresnel);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}