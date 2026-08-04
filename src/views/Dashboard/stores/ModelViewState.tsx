import { create } from 'zustand';

export const MODEL_GROUP_PREFIXES = ['rotor_',
    'desorption_fan_',
    'absorption_fan_',
    'conbustion_chamber_',
    'concentrated_',
    'inlet_',
    'outlet_'];

export enum ModelPartGroup {
    Rotor = 'rotor_',
    DesorptionFan = 'desorption_fan_',
    AbsorptionFan = 'absorption_fan_',
    CombustionChamber = 'conbustion_chamber_',
    Concentrated = 'concentrated_',
    Inlet = 'inlet_',
    Outlet = 'outlet_'
}

interface ViewStateStore {
    // 当前激活的部件组前缀，null 表示无高亮
    selectedGroup: ModelPartGroup | null;

    selectGroup: (prefix: ModelPartGroup | null) => void;
    toggleSelection: (prefix: ModelPartGroup) => void;
}

export const useModelViewStateStore = create<ViewStateStore>((set) => ({
    selectedGroup: null,

    selectGroup: (prefix) => set({ selectedGroup: prefix }),

    // 切换选中：如果重复点击已选中的组，则取消高亮；否则切换到新组
    toggleSelection: (prefix) =>
        set((state) => ({
            selectedGroup: state.selectedGroup === prefix ? null : prefix,
        })),
}));