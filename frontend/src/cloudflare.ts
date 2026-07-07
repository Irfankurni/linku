import { AngularAppEngine } from '@angular/ssr';

interface Env {
  ASSETS: Fetcher;
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
    const response = await angularApp.handle(request);
    return response ?? env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
