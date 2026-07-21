import { AngularAppEngine } from '@angular/ssr';

interface Env {
  ASSETS: Fetcher;
  BACKEND: Fetcher;
}

const angularApp = new AngularAppEngine();

/**
 * Cloudflare Worker entry point for Angular SSR.
 *
 * - SSR routes (e.g. /:username) are rendered server-side by AngularAppEngine.
 * - Static assets (JS/CSS/images) are served via the Workers Assets binding (env.ASSETS).
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const originalFetch = globalThis.fetch;

    // Override global fetch to route API and asset requests through correct bindings
    // This bypasses the Cloudflare routing loop limitation for workers on the same zone.
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const req = new Request(input, init);

      // Route backend API requests through Service Binding
      if (req.url.startsWith('https://linku-workers.kuradev.workers.dev')) {
        const backendReq = new Request(req);
        backendReq.headers.delete('host');
        backendReq.headers.delete('x-forwarded-host');
        return env.BACKEND.fetch(backendReq);
      }

      // Route frontend asset requests (like i18n JSON) through ASSETS binding
      if (req.url.startsWith('https://linku-frontend.kuradev.workers.dev')) {
        return env.ASSETS.fetch(req);
      }

      return originalFetch(req);
    };

    try {
      const response = await angularApp.handle(request);
      return response ?? env.ASSETS.fetch(request);
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
} satisfies ExportedHandler<Env>;
