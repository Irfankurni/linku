import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id:      string;
  type:    ToastType;
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private show(type: ToastType, message: string, duration = 4000) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this._toasts.update(t => [...t, { id, type, message, duration }]);
    if (duration > 0) setTimeout(() => this.dismiss(id), duration);
    return id;
  }

  success(message: string, duration?: number) { return this.show('success', message, duration); }
  error(message: string,   duration?: number) { return this.show('error',   message, duration); }
  info(message: string,    duration?: number) { return this.show('info',    message, duration); }
  warning(message: string, duration?: number) { return this.show('warning', message, duration); }

  dismiss(id: string) {
    this._toasts.update(t => t.filter(x => x.id !== id));
  }

  clear() {
    this._toasts.set([]);
  }
}
