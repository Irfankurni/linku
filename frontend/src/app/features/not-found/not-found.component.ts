import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950
                flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div class="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
        404
      </div>
      <h1 class="text-2xl font-bold text-white">{{ 'NOT_FOUND.TITLE' | translate }}</h1>
      <p class="text-slate-400 max-w-xs">{{ 'NOT_FOUND.DESC' | translate }}</p>
      <a routerLink="/"
         class="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors">
        ← {{ 'NOT_FOUND.BTN' | translate }}
      </a>
    </div>
  `,
})
export class NotFoundComponent {}
