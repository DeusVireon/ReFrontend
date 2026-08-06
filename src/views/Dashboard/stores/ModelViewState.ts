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

interface ViewStateStore {
    // 当前激活的部件组前缀，null 表示无高亮
    selectedGroup: ModelPartEnum | null;
    selectedAttr: AttrKeyEnum | null;
    geoAnchors: Record<ModelPartEnum, THREE.Vector3> | null;
    gasFlowPath: Record<string, THREE.Curve<THREE.Vector3>> | null;

    selectGroup: (prefix: ModelPartEnum | null) => void;
    selectAttr: (attrKey: AttrKeyEnum | null) => void;
    toggleSelection: (prefix: ModelPartEnum) => void;
    setGeoAnchors: (anchors: Record<ModelPartEnum, THREE.Vector3>) => void;
    setGasFlowPath: (path: Record<string, THREE.Curve<THREE.Vector3>>) => void;
}

export const useModelViewStateStore = create<ViewStateStore>((set) => ({
    selectedGroup: null,
    selectedAttr: null,
    geoAnchors: null,
    gasFlowPath: null,

    selectGroup: (prefix) => set({
        selectedGroup: prefix,
        selectedAttr: BOARD_PROP_MAP[prefix as ModelPartEnum]?.linkedData?.at(0)?.attrKey as AttrKeyEnum ?? null
    }),
    selectAttr: (attrKey) => set({ selectedAttr: attrKey }),

    // 切换选中：如果重复点击已选中的组，则取消高亮；否则切换到新组
    toggleSelection: (prefix) =>
        set((state) => ({
            selectedGroup: state.selectedGroup === prefix ? null : prefix,
            selectedAttr: BOARD_PROP_MAP[prefix as ModelPartEnum]?.linkedData?.at(0)?.attrKey as AttrKeyEnum ?? null,
        })),
    setGeoAnchors: (anchors) => set({ geoAnchors: anchors }),
    setGasFlowPath: (path) => set({ gasFlowPath: path }),
}));