import { Component, inject, OnInit, signal } from '@angular/core';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { PlanGateComponent } from '../../../shared/components/plan-gate/plan-gate.component';
import type {
  AnalyticsSummaryResponse,
  LinkAnalytics,
  DeviceAnalytics,
} from '../../../core/models/analytics.model';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [SkeletonComponent, PlanGateComponent, TranslatePipe],
  template: `
    <div class="max-w-4xl space-y-6">

      <!-- Header + period selector -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">{{ 'DASHBOARD.ANALYTICS.TITLE' | translate }}</h1>
        <select
          (change)="onDaysChange($event)"
          class="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="7">{{ 'DASHBOARD.ANALYTICS.DAYS_7' | translate }}</option>
          @if (isPro()) {
            <option value="30">{{ 'DASHBOARD.ANALYTICS.DAYS_30' | translate }}</option>
            <option value="90">{{ 'DASHBOARD.ANALYTICS.DAYS_90' | translate }}</option>
          }
        </select>
      </div>

      <!-- Summary stats -->
      @if (loading()) {
        <div class="grid grid-cols-3 gap-4">
          @for (i of [1,2,3]; track i) {
            <div class="rounded-2xl bg-white/5 border border-white/10 p-5 animate-pulse space-y-2">
              <app-skeleton height="0.75rem" width="60%" />
              <app-skeleton height="2.5rem" width="50%" />
            </div>
          }
        </div>
      } @else if (summary()) {
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
            <p class="text-xs text-slate-400 uppercase tracking-wider mb-2">{{ 'DASHBOARD.ANALYTICS.PAGE_VIEWS' | translate }}</p>
            <p class="text-4xl font-black text-white">{{ summary()!.summary.views }}</p>
          </div>
          <div class="rounded-2xl bg-white/5 border border-violet-500/20 p-5">
            <p class="text-xs text-slate-400 uppercase tracking-wider mb-2">{{ 'DASHBOARD.ANALYTICS.LINK_CLICKS' | translate }}</p>
            <p class="text-4xl font-black text-violet-400">{{ summary()!.summary.clicks }}</p>
          </div>
          <div class="rounded-2xl bg-white/5 border border-emerald-500/20 p-5">
            <p class="text-xs text-slate-400 uppercase tracking-wider mb-2">{{ 'DASHBOARD.ANALYTICS.BUY_CLICKS' | translate }}</p>
            <p class="text-4xl font-black text-emerald-400">{{ summary()!.summary.buy_clicks }}</p>
          </div>
        </div>
      }

      <!-- Top links -->
      <div class="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
        <h2 class="text-base font-semibold text-white">{{ 'DASHBOARD.ANALYTICS.TOP_LINKS' | translate }}</h2>
        @if (topLinks().length === 0) {
          <p class="text-slate-500 text-sm">{{ 'DASHBOARD.ANALYTICS.NO_DATA' | translate }}</p>
        } @else {
          <div class="space-y-3">
            @for (link of topLinks(); track link.entity_id) {
              <div class="flex items-center gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-white truncate">{{ link.title }}</p>
                  <p class="text-xs text-slate-500 truncate">{{ link.url }}</p>
                </div>
                <div class="shrink-0 text-right">
                  <p class="text-sm font-bold text-violet-400">{{ link.click_count }}</p>
                  <p class="text-xs text-slate-500">{{ 'DASHBOARD.ANALYTICS.CLICKS' | translate }}</p>
                </div>
              </div>
              <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full"
                  [style.width.%]="barWidth(link.click_count)"
                ></div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Device breakdown (PRO) -->
      <app-plan-gate [hasAccess]="isPro()" planLabel="Pro" [message]="'DASHBOARD.ANALYTICS.PRO_DESC' | translate">
        <div class="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
          <h2 class="text-base font-semibold text-white">{{ 'DASHBOARD.ANALYTICS.DEVICE_BREAKDOWN' | translate }}</h2>
          @for (d of devices(); track d.device) {
            <div class="flex items-center gap-3">
              <span class="text-lg">{{ deviceIcon(d.device) }}</span>
              <span class="text-sm text-slate-300 capitalize flex-1">{{ d.device }}</span>
              <span class="text-sm font-bold text-white">{{ d.count }}</span>
            </div>
          }
        </div>
      </app-plan-gate>
    </div>
  `,
})
export class AnalyticsDashboardComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  protected readonly auth           = inject(AuthService);

  loading  = signal(true);
  days     = signal(7);
  summary  = signal<AnalyticsSummaryResponse | null>(null);
  topLinks = signal<LinkAnalytics[]>([]);
  devices  = signal<DeviceAnalytics[]>([]);
  isPro    = () => ['pro', 'business'].includes(this.auth.plan());

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const d = this.days();
    this.analyticsService.getSummary(d).subscribe(res => { this.summary.set(res.data); this.loading.set(false); });
    this.analyticsService.getLinkAnalytics(d).subscribe(res => this.topLinks.set(res.data));
    if (this.isPro()) {
      this.analyticsService.getDeviceAnalytics(d).subscribe(res => this.devices.set(res.data));
    }
  }

  onDaysChange(event: Event) {
    this.days.set(parseInt((event.target as HTMLSelectElement).value));
    this.load();
  }

  barWidth(count: number): number {
    const max = this.topLinks()[0]?.click_count ?? 1;
    return max > 0 ? Math.round((count / max) * 100) : 0;
  }

  deviceIcon(device: string): string {
    return { mobile: '📱', desktop: '💻', tablet: '📟' }[device] ?? '❓';
  }
}
