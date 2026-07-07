import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Auth pages — client-side only (no SSR needed)
  { path: 'login',    renderMode: RenderMode.Client },
  { path: 'register', renderMode: RenderMode.Client },

  // Dashboard — client-side only (behind auth)
  { path: 'dashboard/**', renderMode: RenderMode.Client },

  // Public profile — SSR at request time (dynamic, not prerendered)
  { path: ':username',             renderMode: RenderMode.Server },
  { path: ':username/p/:slug',     renderMode: RenderMode.Server },

  // Everything else — client-side
  { path: '**', renderMode: RenderMode.Client },
];
