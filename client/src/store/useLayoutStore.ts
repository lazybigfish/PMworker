import { create } from 'zustand';
import { ReactNode } from 'react';

export interface BreadcrumbItem {
  title: ReactNode;
  path?: string;
}

interface LayoutState {
  breadcrumbItems: BreadcrumbItem[] | null;
  setBreadcrumb: (items: BreadcrumbItem[] | null) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  breadcrumbItems: null,
  setBreadcrumb: (items) => set({ breadcrumbItems: items }),
}));
