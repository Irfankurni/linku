import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title, Meta } from '@angular/platform-browser';
import { AnalyticsService } from '../../core/services/analytics.service';
import { environment } from '../../../environments/environment';
import type { User } from '../../core/models/user.model';
import type { Link } from '../../core/models/link.model';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

interface PublicProfileData {
  user: User;
  links: Link[];
}

import { THEMES } from '../../core/constants/themes';

@Component({
  selector: 'app-profile-page',
  imports: [TranslatePipe],
  template: `
    @if (loading()) {
      <div class="min-h-screen bg-slate-900 flex items-center justify-center">
        <div class="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    } @else if (notFound()) {
      <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p class="text-6xl">🔍</p>
        <h1 class="text-2xl font-bold text-white">{{ 'PROFILE.NOT_FOUND_TITLE' | translate }}</h1>
        <p class="text-slate-400">{{ 'PROFILE.NOT_FOUND_DESC' | translate:{ username: username() } }}</p>
      </div>
    } @else if (profile()) {
      <div class="min-h-screen text-white bg-cover bg-center bg-no-repeat bg-fixed"
           [class]="!customBackground() ? 'bg-gradient-to-br ' + themeGradient() : ''"
           [style.backgroundImage]="customBackground() ? 'url(' + customBackground() + ')' : null">
        <div class="max-w-xl mx-auto px-4 py-12 space-y-8">

          <!-- Avatar & Bio -->
          <div class="text-center space-y-3">
            @if (profile()!.user.avatar_url) {
              <img [src]="profile()!.user.avatar_url" [alt]="profile()!.user.display_name"
                   class="w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-white/10" />
            } @else {
              <div class="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-violet-600 to-pink-600
                          flex items-center justify-center text-3xl font-bold">
                {{ profile()!.user.display_name.charAt(0).toUpperCase() }}
              </div>
            }
            <div>
              <h1 class="text-xl font-bold">{{ profile()!.user.display_name }}</h1>
              <p class="text-slate-400 text-sm">@{{ profile()!.user.username }}</p>
            </div>
            @if (profile()!.user.bio) {
              <p class="text-slate-300 text-sm max-w-xs mx-auto leading-relaxed">{{ profile()!.user.bio }}</p>
            }
          </div>

          <!-- Links -->
          @if (profile()!.links.length > 0) {
            <div class="space-y-3">
              @for (link of profile()!.links; track link.id) {
                @if (link.type === 'header') {
                  <p class="text-center text-xs text-slate-500 uppercase tracking-widest pt-2">{{ link.title }}</p>
                } @else if (link.type === 'divider') {
                  <hr class="border-white/10" />
                } @else {
                  <a
                    [href]="link.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    (click)="trackClick(link.id)"
                    class="flex items-center gap-3 w-full px-5 py-4 rounded-2xl
                           bg-white/8 hover:bg-white/15 border border-white/10 hover:border-white/20
                           transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    [class.ring-2]="link.is_featured"
                    [class.ring-violet-500]="link.is_featured"
                  >
                    @if (link.icon_url) {
                      <img [src]="link.icon_url" [alt]="" class="w-6 h-6 rounded" />
                    }
                    <span class="font-medium text-sm flex-1 text-center">{{ link.title }}</span>
                    @if (link.is_featured) {
                      <span class="text-amber-400 text-xs">★</span>
                    }
                  </a>
                }
              }
            </div>
          }


          <!-- Footer -->
          <div class="text-center pt-4">
            <a href="/" class="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              {{ 'PROFILE.POWERED_BY' | translate }}
            </a>
          </div>
        </div>
      </div>
    }
  `,
})
export class ProfilePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly analyticsService = inject(AnalyticsService);

  loading = signal(true);
  notFound = signal(false);
  profile = signal<PublicProfileData | null>(null);
  username = signal('');

  themeGradient() {
    const themeId = this.profile()?.user?.theme ?? 'default';
    const theme = THEMES.find(t => t.id === themeId);
    return theme?.gradient ?? THEMES[0].gradient;
  }

  customBackground() {
    return (this.profile()?.user?.settings as any)?.background_url;
  }

  ngOnInit() {
    const u = this.route.snapshot.paramMap.get('username') ?? '';
    this.username.set(u);

    this.http
      .get<{ success: boolean; data: PublicProfileData }>(`${environment.apiBaseUrl}/p/${u}`)
      .subscribe({
        next: res => {
          this.profile.set(res.data);
          this.loading.set(false);
          // SSR-friendly meta tags
          const { user } = res.data;
          this.titleService.setTitle(`${user.display_name} (@${user.username})`);
          if (user.bio) this.metaService.updateTag({ name: 'description', content: user.bio });
          // Track page view (fire & forget)
          const referrer = typeof document !== 'undefined' ? document.referrer : undefined;
          this.analyticsService.track(u, { entity_type: 'page', event: 'view', referrer });
        },
        error: () => { this.notFound.set(true); this.loading.set(false); },
      });
  }

  trackClick(linkId: string) {
    this.analyticsService.track(this.username(), { entity_type: 'link', entity_id: linkId, event: 'click' });
  }

}
