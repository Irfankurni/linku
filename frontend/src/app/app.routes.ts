import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Default ──────────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingPageComponent),
    pathMatch: 'full'
  },

  // ── Auth (unauthenticated only) ───────────────────────────────────────────
  {
    path: '',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent),
        title: 'Masuk — Web Bio',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent),
        title: 'Daftar — Web Bio',
      },
    ],
  },

  // ── Dashboard (authenticated) ─────────────────────────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/dashboard/overview/overview.component').then(m => m.OverviewComponent),
        title: 'Dashboard — Web Bio',
      },
      {
        path: 'links',
        loadComponent: () =>
          import('./features/dashboard/links/link-list.component').then(m => m.LinkListComponent),
        title: 'Kelola Link — Web Bio',
      },

      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/dashboard/analytics/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent),
        title: 'Analitik — Web Bio',
      },
      {
        path: 'appearance',
        loadComponent: () =>
          import('./features/dashboard/appearance/appearance.component').then(m => m.AppearanceComponent),
        title: 'Tampilan — Web Bio',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/dashboard/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Pengaturan — Web Bio',
      },
    ],
  },

  // ── Public Profile (SSR) ──────────────────────────────────────────────────
  {
    path: ':username',
    loadComponent: () =>
      import('./features/public-profile/profile-page.component').then(m => m.ProfilePageComponent),
    // Title resolved dynamically in component
  },


  // ── 404 ──────────────────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Halaman Tidak Ditemukan',
  },
];
