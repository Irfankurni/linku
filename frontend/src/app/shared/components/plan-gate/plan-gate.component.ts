import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-plan-gate',
  imports: [],
  template: `
    @if (hasAccess()) {
      <ng-content />
    } @else {
      <div class="relative rounded-2xl border border-violet-500/30 bg-violet-950/30 p-6 text-center">
        <!-- Blurred content slot -->
        <div class="select-none blur-sm pointer-events-none opacity-40 mb-4">
          <ng-content select="[preview]" />
        </div>

        <div class="space-y-3">
          <div class="text-2xl">🚀</div>
          <h3 class="text-base font-bold text-white">Fitur {{ planLabel() }}</h3>
          <p class="text-sm text-slate-400">{{ message() }}</p>
          <a
            (click)="goToSetting()"
            class="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500
                   text-white text-sm font-semibold transition-colors"
          >
            ✦ Upgrade Sekarang
          </a>
        </div>
      </div>
    }
  `,
})
export class PlanGateComponent {
  private readonly router = inject(Router);

  hasAccess = input.required<boolean>();
  planLabel = input('Pro');
  message = input('Upgrade ke Pro untuk mengakses fitur ini dan masih banyak lagi.');

  goToSetting(): void {
    this.router.navigate(['/dashboard/settings'], { queryParams: { tab: 'plan' } });
  }
}
