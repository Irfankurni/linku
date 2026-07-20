import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverHeaderInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // Strip the host header so Cloudflare fetches the absolute URL's actual host
  // rather than forwarding the frontend worker's host.
  const modifiedReq = req.clone({
    headers: req.headers.delete('host').delete('Host').delete('x-forwarded-host')
  });
  return next(modifiedReq);
};

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideHttpClient(withInterceptors([serverHeaderInterceptor]))
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
