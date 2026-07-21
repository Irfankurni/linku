import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { UserService } from '../../../core/services/user.service';
import { LinkService } from '../../../core/services/link.service';
import { ToastService } from '../../../core/services/toast.service';

import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import type { AnalyticsSummaryResponse } from '../../../core/models/analytics.model';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [RouterLink, SkeletonComponent, TranslatePipe],
  template: `
    <div class="space-y-6 max-w-5xl">

      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-white">
          {{ 'DASHBOARD.OVERVIEW.WELCOME' | translate:{'name': userService.profile()?.display_name ?? '...'} }}
        </h1>
        <p class="text-slate-400 text-sm mt-1">
          {{ 'DASHBOARD.OVERVIEW.SUBTITLE' | translate }}
        </p>
      </div>

      <!-- Public link -->
      <div class="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
        <span class="text-slate-400 text-sm">{{ 'DASHBOARD.OVERVIEW.PUBLIC_PAGE' | translate }}</span>
        <a
          [href]="'/' + (userService.profile()?.username ?? '')"
          target="_blank"
          class="text-violet-400 hover:text-violet-300 text-sm font-medium truncate transition-colors"
        >
          {{ environment.frontendUrl }}/{{ userService.profile()?.username ?? '...' }}
        </a>
        <button (click)="copyLink()" class="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Copy to clipboard">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <span class="ml-auto text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full">{{ 'DASHBOARD.OVERVIEW.LIVE' | translate }}</span>
      </div>

      <!-- Stats cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        @if (loading()) {
          @for (i of [1,2,3]; track i) {
            <div class="rounded-2xl bg-white/5 border border-white/10 p-5 animate-pulse space-y-3">
              <app-skeleton height="0.875rem" width="50%" />
              <app-skeleton height="2rem" width="40%" />
            </div>
          }
        } @else {
          <div class="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-1">
            <p class="text-xs text-slate-400 uppercase tracking-wider">{{ 'DASHBOARD.OVERVIEW.TOTAL_VIEWS' | translate }}</p>
            <p class="text-3xl font-bold text-white">{{ summary()?.summary?.views ?? 0 }}</p>
          </div>
          <div class="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-1">
            <p class="text-xs text-slate-400 uppercase tracking-wider">{{ 'DASHBOARD.OVERVIEW.TOTAL_CLICKS' | translate }}</p>
            <p class="text-3xl font-bold text-violet-400">{{ summary()?.summary?.clicks ?? 0 }}</p>
          </div>

        }
      </div>

      <!-- Quick actions -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a routerLink="/dashboard/links"
           class="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/40
                  hover:bg-violet-950/20 transition-all duration-200 group">
          <div class="h-12 w-12 rounded-xl bg-violet-900/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">⛓</div>
          <div>
            <p class="font-semibold text-white">{{ 'DASHBOARD.OVERVIEW.MANAGE_LINKS' | translate }}</p>
            <p class="text-xs text-slate-400">{{ 'DASHBOARD.OVERVIEW.ACTIVE_LINKS' | translate:{'count': linkService.links().length.toString()} }}</p>
          </div>
          <span class="ml-auto text-slate-600 group-hover:text-violet-400 transition-colors">→</span>
        </a>

      </div>
    </div>
  `,
})
export class OverviewComponent implements OnInit {
  protected readonly environment = environment;
  protected readonly userService = inject(UserService);
  protected readonly linkService = inject(LinkService);
  private readonly toastService = inject(ToastService);

  private readonly analyticsService = inject(AnalyticsService);

  loading = signal(true);
  summary = signal<AnalyticsSummaryResponse | null>(null);

  ngOnInit() {
    this.linkService.loadLinks().subscribe();

    this.analyticsService.getSummary(7).subscribe({
      next: res => { this.summary.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  async copyLink() {
    const username = this.userService.profile()?.username;
    if (!username) return;
    const url = `${this.environment.frontendUrl}/${username}`;
    try {
      await navigator.clipboard.writeText(url);
      this.toastService.success('Link disalin ke clipboard!');
    } catch (err) {
      this.toastService.error('Gagal menyalin link');
    }
  }
}
