import { create } from 'zustand';

interface NavigationItem {
  name: string;
  path?: string;
}

interface SidebarState {
  title?: string;
  breadcrumb?: NavigationItem[];
  subSidebar?: NavigationItem[];
  additionalComponents?: React.ReactNode;
  
  setSidebarData: (data: Partial<SidebarState>) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  title: undefined,
  breadcrumb: undefined,
  subSidebar: undefined,
  additionalComponents: undefined,
  setSidebarData: (data) => set((state) => ({ ...state, ...data })),
}));
