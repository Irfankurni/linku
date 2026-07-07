import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { Toast, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none" role="region" aria-label="Notifikasi">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 min-w-72 max-w-sm px-4 py-3 rounded-xl shadow-2xl
                 backdrop-blur-md border text-sm font-medium transition-all duration-300 animate-slide-in"
          [ngClass]="toastClass(toast)"
          role="alert"
        >
          <span class="text-lg leading-none mt-0.5">{{ toastIcon(toast) }}</span>
          <span class="flex-1 leading-snug">{{ toast.message }}</span>
          <button
            (click)="toastService.dismiss(toast.id)"
            class="opacity-60 hover:opacity-100 transition-opacity text-xs mt-0.5 shrink-0"
            aria-label="Tutup"
          >✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .animate-slide-in { animation: slide-in 0.25s cubic-bezier(0.16,1,0.3,1); }
  `],
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  toastClass(toast: Toast): Record<string, boolean> {
    return {
      'bg-emerald-900/90 border-emerald-700 text-emerald-100': toast.type === 'success',
      'bg-red-900/90 border-red-700 text-red-100': toast.type === 'error',
      'bg-blue-900/90 border-blue-700 text-blue-100': toast.type === 'info',
      'bg-amber-900/90 border-amber-700 text-amber-100': toast.type === 'warning',
    };
  }

  toastIcon(toast: Toast): string {
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' } as const;
    return icons[toast.type];
  }
}
