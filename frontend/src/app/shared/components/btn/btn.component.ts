import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

export type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type BtnSize    = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-btn',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [ngClass]="classes()"
      class="inline-flex items-center justify-center gap-2 font-semibold rounded-xl
             transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500"
    >
      @if (loading()) {
        <svg class="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      }
      <ng-content />
    </button>
  `,
})
export class BtnComponent {
  variant = input<BtnVariant>('primary');
  size    = input<BtnSize>('md');
  type    = input<'button' | 'submit' | 'reset'>('button');
  disabled = input(false);
  loading  = input(false);
  fullWidth = input(false);

  classes() {
    const v = this.variant();
    const s = this.size();
    return {
      // Variants
      'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40': v === 'primary',
      'bg-white/10 hover:bg-white/20 text-white border border-white/20':             v === 'secondary',
      'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40':           v === 'danger',
      'hover:bg-white/10 text-slate-300 hover:text-white':                            v === 'ghost',
      'border border-violet-500 text-violet-400 hover:bg-violet-500/10':              v === 'outline',
      // Sizes
      'text-xs px-3 py-1.5': s === 'sm',
      'text-sm px-4 py-2.5': s === 'md',
      'text-base px-6 py-3': s === 'lg',
      // Full width
      'w-full': this.fullWidth(),
    };
  }
}
