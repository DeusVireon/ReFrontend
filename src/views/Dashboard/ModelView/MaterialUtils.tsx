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



export const GasShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#00f0ff') },
    uSpeed: { value: 1.5 },
    uDensity: { value: 5.0 }, // 气体纹理密度
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uSpeed;
    uniform float uDensity;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    // 伪随机与 Simplex Noise 简易实现
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      // U 轴随时间偏移，实现气体沿路径前进
      vec2 st = vec2(vUv.x * uDensity - uTime * uSpeed, vUv.y * 3.0);
      
      // 叠加多层噪声模拟气体的紊流感
      float noise1 = snoise(st);
      float noise2 = snoise(st * 2.0 + vec2(uTime, 0.0)) * 0.5;
      float gasPattern = smoothstep(0.1, 0.8, noise1 + noise2);

      // V 轴边缘渐隐，消除管状硬边缘
      float edgeFade = sin(vUv.y * 3.1415926);
      edgeFade = pow(edgeFade, 2.0);

      // 结合菲涅尔效应让气体边缘呈现透光感
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);

      float finalAlpha = gasPattern * edgeFade * (0.3 + 0.7 * fresnel);

      gl_FragColor = vec4(uColor, finalAlpha);
    }
  `
};

export const LaserPulseShader = {
  uniforms: {
    uTime: { value: 0 },
    uBaseColor: { value: new THREE.Color('#0033aa') }, // 管道基底色
    uPulseColor: { value: new THREE.Color('#00ffff') }, // 极光脉冲高亮色
    uSpeed: { value: 1 },                            // 移动速度
    uPulseFrequency: { value: 3.0 },                    // 脉冲密度 (沿 path 出现的频次)
    uPulseWidth: { value: 1 },                       // 脉冲光斑宽度 (0.05 - 0.5)
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform vec3 uPulseColor;
    uniform float uSpeed;
    uniform float uPulseFrequency;
    uniform float uPulseWidth;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      // 沿 U 轴移动的波形
      float progress = fract(vUv.x * uPulseFrequency - uTime * uSpeed);
      
      // 生成尖锐带拖尾的脉冲波形
      float pulse = smoothstep(1.0 - uPulseWidth, 1.0, progress);
      float trail = pow(progress, 8.0) * (1.0 - pulse); // 拖尾硬度
      float intensity = pulse + trail * 0.6;

      // 菲涅尔边缘虚化与管芯高光
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 1.5);
      float centerGlow = pow(sin(vUv.y * 3.1415926), 2.0);

      // 颜色混合与透明度计算
      vec3 finalColor = mix(uBaseColor, uPulseColor, intensity);
      float alpha = (intensity * 0.8 + 0.2) * centerGlow * (0.4 + 0.6 * fresnel);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

export const QuantumPlasmaShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color('#59a022') }, // 主色 A
    uColorB: { value: new THREE.Color('#d95686') }, // 辅色 B
    uSpeed: { value: 0.8 },                          // 流动速度
    uScale: { value: 5.0 },                          // 噪声缩放 (流体细碎度)
    uDistortion: { value: 4 },                     // 扭曲强度
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uDistortion;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    // 基础 2D 噪声
    vec2 hash(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(dot(hash(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
                     dot(hash(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
                 mix(dot(hash(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
                     dot(hash(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x), u.y);
    }

    void main() {
      vec2 st = vec2(vUv.x * uScale, vUv.y * 2.0);
      float t = uTime * uSpeed;

      // 域扭曲 (Domain Warping)：用噪声扰动坐标再采样噪声
      vec2 q = vec2(noise(st + vec2(t, 0.0)), noise(st + vec2(0.0, t)));
      vec2 r = vec2(noise(st + uDistortion * q + vec2(t * 1.2, t * 0.5)), 
                    noise(st + uDistortion * q + vec2(t * 0.8, t * 1.5)));

      float plasma = noise(st + r);

      // 管身边缘消融
      float edgeFade = sin(vUv.y * 3.1415926);
      edgeFade = pow(edgeFade, 1.5);

      // 双色插值
      vec3 finalColor = mix(uColorA, uColorB, clamp(plasma + 0.5, 0.0, 1.0));
      
      // 菲涅尔增亮
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(2.5 - max(dot(normal, viewDir), 0.0), 2.0);

      float alpha = smoothstep(-0.2, 0.6, plasma) * edgeFade * (0.5 + 0.5 * fresnel);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

export const ToonVaporShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#33eeaa') },     // 气流主色
    uRimColor: { value: new THREE.Color('#d16635') },  // 描边/高光色
    uSpeed: { value: 1.2 },
    uSteps: { value: 4.0 },                            // 卡通色阶层数
    uDensity: { value: 8.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uRimColor;
    uniform float uSpeed;
    uniform float uSteps;
    uniform float uDensity;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    // 简单 2D 伪随机噪声
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float n2d(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }

    void main() {
      vec2 st = vec2(vUv.x * uDensity - uTime * uSpeed, vUv.y * 2.0);
      float rawNoise = n2d(st) * 1.7 + n2d(st * 2.3) * 0.3;

      // 量化噪声，产生明确的色阶分界线
      float steppedNoise = floor(rawNoise * uSteps) / uSteps;

      // 卡通边缘高光 (Toon Rim Light)
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float NdotV = max(dot(normal, viewDir), 0.0);
      float rim = step(0.65, 1.0 - NdotV);

      // 根据色阶和边缘决定颜色
      vec3 finalColor = mix(uColor, uRimColor, rim);
      
      // 硬切透明度
      float edgeFade = sin(vUv.y * 3.1415926);
      float alpha = step(0.25, steppedNoise * edgeFade);

      gl_FragColor = vec4(finalColor, alpha * 0.85);
    }
  `
};


export const DenseFluidGasShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorCore: { value: new THREE.Color('#ff5511') }, // 气芯高亮色（橙红）
    uColorEdge: { value: new THREE.Color('#770011') }, // 外围浓烟色（深红/暗红）
    uSpeed: { value: 0.5 },                             // 流动速度
    uTurbulence: { value: 5 },                        // 紊流密度
    uCoreDensity: { value: 2 },                       // 气芯密实度 (解决稀薄问题：1.0 - 3.0)
    uEdgeSoftness: { value: 3.0 },                      // 边缘软化指数 (解决穿模问题：1.5 - 4.0)
    uOpacity: { value: 0.75 },                          // 整体透明度
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorCore;
    uniform vec3 uColorEdge;
    uniform float uSpeed;
    uniform float uTurbulence;
    uniform float uCoreDensity;
    uniform float uEdgeSoftness;
    uniform float uOpacity;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    // 经典 2D Simplex 噪声
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      // 1. 基础坐标与时间偏移
      float t = uTime * uSpeed;
      vec2 st = vec2(vUv.x * uTurbulence - t, vUv.y * 2.0);

      // 2. 域扭曲 (Domain Warping)：制造流体交织感
      float q = snoise(st);
      float r = snoise(st + vec2(q * 0.8, t * 0.5));

      // 3. 管道纵向中心线权重 (V 轴中心为 1，两侧边缘为 0)
      float centerWeight = sin(vUv.y * 3.1415926);

      // 4. 计算密实度 (Core Density)：将噪声与中心权重结合，使用 smoothstep/pow 加固核心
      float rawGas = (r * 0.5 + 0.5) * centerWeight;
      float denseGas = pow(rawGas, 1.0 / uCoreDensity); 

      // 5. 颜色渐变：气芯 (High Density) 到 边缘 (Low Density)
      vec3 finalColor = mix(uColorEdge, uColorCore, smoothstep(0.2, 0.8, denseGas));

      // 6. 边缘平滑羽化 (Soft Fade)：彻底解决 3D 几何边缘的硬切/穿模问题
      float edgeAlpha = pow(centerWeight, uEdgeSoftness);

      // 7. 视角菲涅尔边缘柔化
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 1.5);

      float finalAlpha = denseGas * edgeAlpha * (0.6 + 0.4 * fresnel) * uOpacity;

      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `
};