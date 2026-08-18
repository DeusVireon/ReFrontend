import { create } from 'zustand';
import { AttrKeyEnum } from '../models/AttrKeyEnum';
import { BOARD_PROP_MAP } from '../models/BoardPropMap';
import { ModelPartEnum } from '../models/ModelPartEnum';
import * as THREE from 'three';

export const MODEL_GROUP_PREFIXES = ['rotor_',
    'desorption_fan_',
    'absorption_fan_',
    'combustion_chamber_',
    'concentrated_',
    'inlet_',
    'outlet_'];

export enum CamControlMode {
    Focus = 'focus-mode',
    Free = 'free-mode',
    FullView = 'full-view-mode',
    Carousel = 'carousel-mode',
    Attention = 'attention-mode',
}

interface ViewStateStore {
    camControlMode: CamControlMode;
    selectedGroup: ModelPartEnum | null;
    selectedAttr: AttrKeyEnum | null;
    geoAnchors: Record<ModelPartEnum, THREE.Vector3> | null;
    gasFlowPath: Record<string, THREE.Curve<THREE.Vector3>> | null;

    selectGroup: (prefix: ModelPartEnum | null) => void;
    selectNextGroup: () => void;
    selectAttr: (attrKey: AttrKeyEnum | null) => void;
    toggleSelection: (prefix: ModelPartEnum) => void;
    setGeoAnchors: (anchors: Record<ModelPartEnum, THREE.Vector3>) => void;
    setGasFlowPath: (path: Record<string, THREE.Curve<THREE.Vector3>>) => void;
    setCamControlMode: (mode: CamControlMode) => void;
}

export const useModelViewStateStore = create<ViewStateStore>((set) => ({
    selectedGroup: null,
    selectedAttr: null,
    geoAnchors: null,
    gasFlowPath: null,
    camControlMode: CamControlMode.Carousel,

    selectGroup: (prefix) => set({
        selectedGroup: prefix,
        selectedAttr: BOARD_PROP_MAP[prefix as ModelPartEnum]?.linkedData?.at(0)?.attrKey as AttrKeyEnum ?? null,
        camControlMode: prefix ? CamControlMode.Focus : CamControlMode.FullView
    }),
    selectNextGroup: () => set((state) => {
        const currentGroup = state.selectedGroup;
        if (!MODEL_GROUP_PREFIXES.length) return state;
        // 找到当前 group 在数组中的索引
        const currentIndex = MODEL_GROUP_PREFIXES.findIndex((prefix) => prefix === currentGroup);
        // 计算下一个索引（利用取余实现首尾循环）
        // 如果 currentIndex 是 -1 (即当前为 null/未选中)，计算结果 ( -1 + 1 ) % len = 0，自动切到第 0 个
        const nextIndex = (currentIndex + 1) % MODEL_GROUP_PREFIXES.length;
        const nextGroup = (MODEL_GROUP_PREFIXES[nextIndex] as ModelPartEnum) ?? null;
        // 提取对应的关联属性
        const selectedAttr = nextGroup
            ? (BOARD_PROP_MAP[nextGroup as ModelPartEnum]?.linkedData?.at(0)?.attrKey as AttrKeyEnum ?? null)
            : null;
        return {
            selectedGroup: nextGroup,
            selectedAttr: selectedAttr,
        };
    }),
    selectAttr: (attrKey) => set({ selectedAttr: attrKey }),
    // 切换选中：如果重复点击已选中的组，则取消高亮；否则切换到新组
    toggleSelection: (prefix) =>
        set((state) => ({
            selectedGroup: state.selectedGroup === prefix ? null : prefix,
            selectedAttr: BOARD_PROP_MAP[prefix as ModelPartEnum]?.linkedData?.at(0)?.attrKey as AttrKeyEnum ?? null,
            camControlMode: prefix ? CamControlMode.Focus : CamControlMode.FullView
        })),
    setGeoAnchors: (anchors) => set({ geoAnchors: anchors }),
    setGasFlowPath: (path) => set({ gasFlowPath: path }),
    setCamControlMode: (mode) => set({
        camControlMode: mode,
    }),
}));