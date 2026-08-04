import { create } from 'zustand';

interface ViewStateStore {
  // 当前激活的部件组前缀，null 表示无高亮
  selectedGroup: string | null;

  selectGroup: (prefix: string | null) => void;
  toggleSelection: (prefix: string) => void;
}

export const useViewStateStore = create<ViewStateStore>((set) => ({
  selectedGroup: null,

  selectGroup: (prefix) => set({ selectedGroup: prefix }),

  // 切换选中：如果重复点击已选中的组，则取消高亮；否则切换到新组
  toggleSelection: (prefix) =>
    set((state) => ({
      selectedGroup: state.selectedGroup === prefix ? null : prefix,
    })),
}));