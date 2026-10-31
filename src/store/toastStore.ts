import { create } from 'zustand';
import { uid } from '@/lib/ids';

export type ToastTone = 'info' | 'success' | 'error';
export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}

interface ToastState {
  toasts: Toast[];
  show: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (t) => {
    const id = uid('toast');
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), t.action ? 5200 : 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  show: (t: Omit<Toast, 'id'>) => useToastStore.getState().show(t),
  success: (title: string, message?: string) => useToastStore.getState().show({ tone: 'success', title, message }),
  error: (title: string, message?: string, action?: Toast['action']) =>
    useToastStore.getState().show({ tone: 'error', title, message, action }),
};
