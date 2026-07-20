import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../core/i18n/translation.service';

const NAV_ITEMS = [
  { path: '/dashboard/overview', icon: '◈', labelKey: 'OVERVIEW' },
  { path: '/dashboard/links', icon: '⛓', labelKey: 'LINKS' },

  { path: '/dashboard/analytics', icon: '📊', labelKey: 'ANALYTICS' },
  { path: '/dashboard/appearance', icon: '🎨', labelKey: 'APPEARANCE' },
  { path: '/dashboard/settings', icon: '⚙', labelKey: 'SETTINGS' },
];

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BadgeComponent, TranslatePipe],
  template: `
    <div class="min-h-screen bg-slate-950 flex">

      <!-- ── Sidebar ──────────────────────────────────────── -->
      <aside class="hidden lg:flex flex-col w-64 border-r border-white/8 bg-slate-900/50 backdrop-blur-xl fixed inset-y-0 z-20">

        <!-- Brand -->
        <div class="px-6 py-5 border-b border-white/8">
          <span class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
            WebBio
          </span>
        </div>

        <!-- Nav -->
        <nav class="flex-1 px-3 py-4 space-y-1" aria-label="Dashboard navigasi">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-violet-600/20 text-violet-300 border-violet-500/40"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/8
                     border border-transparent text-sm font-medium transition-all duration-200"
            >
              <span class="text-base w-5 text-center">{{ item.icon }}</span>
              {{ 'DASHBOARD.SIDEBAR.' + item.labelKey | translate }}
            </a>
          }
        </nav>

        <!-- User info -->
        <div class="px-4 py-4 border-t border-white/8">
          @if (userService.profile(); as profile) {
            <div class="flex items-center gap-3 mb-3">
              @if (profile.avatar_url) {
                <img [src]="profile.avatar_url" [alt]="profile.display_name"
                     class="h-9 w-9 rounded-full object-cover ring-2 ring-violet-500/30" />
              } @else {
                <div class="h-9 w-9 rounded-full bg-violet-700 flex items-center justify-center text-sm font-bold text-white">
                  {{ profile.display_name.charAt(0).toUpperCase() }}
                </div>
              }
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white truncate">{{ profile.display_name }}</p>
                <p class="text-xs text-slate-500 truncate">@{{ profile.username }}</p>
              </div>
            </div>
            <app-badge [plan]="profile.plan" />
          }

          @if (userService.profile()?.plan === 'free') {
            <a routerLink="/dashboard/upgrade"
               class="mt-3 block w-full text-center px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white
                      hover:from-violet-500 hover:to-pink-500 font-bold text-sm shadow-lg shadow-violet-500/25 transition-all">
              Upgrade ke Pro
            </a>
          }

          <div class="flex gap-2">
            <button
              (click)="toggleLanguage()"
              class="mt-3 flex items-center justify-center px-3 py-2 min-w-[4.5rem] rounded-xl text-slate-400 hover:text-white
                     hover:bg-white/10 text-xs font-bold transition-all duration-200 cursor-pointer uppercase border border-white/5 gap-1.5"
            >
              @if (ts.currentLang() === 'id') {
                <span>🇮🇩 ID</span>
              } @else {
                <span>🇺🇸 EN</span>
              }
            </button>
            <button
              (click)="logout()"
              class="mt-3 flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400
                     hover:bg-red-950/30 text-sm transition-all duration-200 cursor-pointer"
            >
              <span>⏻</span> {{ 'DASHBOARD.SIDEBAR.LOGOUT' | translate }}
            </button>
          </div>
        </div>
      </aside>

      <!-- ── Main content ──────────────────────────────────── -->
      <main class="flex-1 lg:pl-64 min-h-screen">
        <!-- Mobile topbar -->
        <header class="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/8 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
          <span class="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">WebBio</span>
          <!-- Mobile nav can be added here -->
        </header>

        <div class="p-6 lg:p-8">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class DashboardLayoutComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly userService = inject(UserService);
  protected readonly ts = inject(TranslationService);
  protected readonly navItems = NAV_ITEMS;

  ngOnInit() {
    this.userService.loadProfile().subscribe();
  }

  logout() {
    this.auth.logout().subscribe();
    this.userService.clear();
  }

  toggleLanguage() {
    const newLang = this.ts.currentLang() === 'id' ? 'en' : 'id';
    this.ts.setLanguage(newLang).subscribe();
  }
}
