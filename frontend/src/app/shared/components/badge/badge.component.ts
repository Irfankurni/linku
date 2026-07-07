import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import type { Plan } from '../../../core/models/user.model';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
      [ngClass]="badgeClass()"
    >
      <span>{{ icon() }}</span>
      {{ plan() }}
    </span>
  `,
})
export class BadgeComponent {
  plan = input.required<Plan>();

  icon() {
    const icons: Record<Plan, string> = { free: '○', pro: '★', business: '◆' };
    return icons[this.plan()];
  }

  badgeClass() {
    return {
      'bg-slate-700 text-slate-300 border border-slate-600':       this.plan() === 'free',
      'bg-violet-900/60 text-violet-300 border border-violet-600': this.plan() === 'pro',
      'bg-amber-900/60 text-amber-300 border border-amber-600':    this.plan() === 'business',
    };
  }
}
