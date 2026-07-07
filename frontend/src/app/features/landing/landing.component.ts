import { Component, inject, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/i18n/translation.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="min-h-screen bg-slate-950 text-white selection:bg-violet-500/30 font-sans overflow-x-hidden">
      <!-- Navbar -->
      <nav class="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
        <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-lg">
              W
            </div>
            <span class="font-bold text-xl tracking-tight">Web Bio</span>
          </div>
          
          <div class="flex items-center gap-4">
            <button (click)="toggleLanguage()" class="flex items-center gap-1.5 px-3 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase transition-colors border border-white/10">
              @if (ts.currentLang() === 'id') {
                <span>🇮🇩 ID</span>
              } @else {
                <span>🇺🇸 EN</span>
              }
            </button>
            
            <div class="w-px h-4 bg-white/20"></div>

            @if (auth.isLoggedIn()) {
              <a routerLink="/dashboard" class="text-sm font-medium hover:text-violet-400 transition-colors">
                {{ 'NAV.DASHBOARD' | translate }}
              </a>
            } @else {
              <a routerLink="/login" class="text-sm font-medium hover:text-white text-slate-300 transition-colors">
                {{ 'NAV.LOGIN' | translate }}
              </a>
              <a routerLink="/register" class="text-sm font-medium bg-white text-slate-950 px-4 py-2 rounded-full hover:bg-slate-200 transition-colors">
                {{ 'NAV.REGISTER' | translate }}
              </a>
            }
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <main class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <!-- Glow effect -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] -z-10"></div>
        
        <div class="max-w-4xl mx-auto text-center space-y-8">
          <h1 class="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
            {{ 'LANDING.HERO.TITLE1' | translate }} <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
              {{ 'LANDING.HERO.TITLE2' | translate }}
            </span>
          </h1>
          
          <p class="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {{ 'LANDING.HERO.DESC' | translate }}
          </p>
          
          <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a routerLink="/register" class="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-semibold text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)]">
              {{ 'LANDING.HERO.CTA_PRIMARY' | translate }}
            </a>
            <a href="#features" class="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-medium text-lg transition-colors border border-white/10">
              {{ 'LANDING.HERO.CTA_SECONDARY' | translate }}
            </a>
          </div>
          <p class="text-sm text-slate-500">{{ 'LANDING.HERO.SUBTEXT' | translate }}</p>
        </div>
      </main>

      <!-- Features Section -->
      <section id="features" class="py-24 bg-white/5 border-y border-white/5">
        <div class="max-w-6xl mx-auto px-6">
          <div class="text-center mb-16">
            <h2 class="text-3xl lg:text-4xl font-bold">{{ 'LANDING.FEATURES.TITLE' | translate }}</h2>
            <p class="text-slate-400 mt-4 max-w-xl mx-auto">{{ 'LANDING.FEATURES.DESC' | translate }}</p>
          </div>
          
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
              <div class="w-12 h-12 bg-violet-500/20 text-violet-400 rounded-2xl flex items-center justify-center text-2xl mb-6">🔗</div>
              <h3 class="text-xl font-semibold mb-3">{{ 'LANDING.FEATURES.ITEM1.TITLE' | translate }}</h3>
              <p class="text-slate-400 leading-relaxed">{{ 'LANDING.FEATURES.ITEM1.DESC' | translate }}</p>
            </div>
            
            <div class="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
              <div class="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center text-2xl mb-6">🛍️</div>
              <h3 class="text-xl font-semibold mb-3">{{ 'LANDING.FEATURES.ITEM2.TITLE' | translate }}</h3>
              <p class="text-slate-400 leading-relaxed">{{ 'LANDING.FEATURES.ITEM2.DESC' | translate }}</p>
            </div>
            
            <div class="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
              <div class="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center text-2xl mb-6">📊</div>
              <h3 class="text-xl font-semibold mb-3">{{ 'LANDING.FEATURES.ITEM3.TITLE' | translate }}</h3>
              <p class="text-slate-400 leading-relaxed">{{ 'LANDING.FEATURES.ITEM3.DESC' | translate }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- How it Works -->
      <section class="py-24">
        <div class="max-w-6xl mx-auto px-6">
          <div class="text-center mb-16">
            <h2 class="text-3xl lg:text-4xl font-bold">{{ 'LANDING.HOW.TITLE' | translate }}</h2>
          </div>
          
          <div class="grid md:grid-cols-3 gap-12 relative">
            <div class="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            <div class="relative text-center space-y-4">
              <div class="w-24 h-24 mx-auto bg-slate-900 border-2 border-violet-500 rounded-full flex items-center justify-center text-3xl font-bold shadow-[0_0_30px_-5px_rgba(124,58,237,0.4)]">1</div>
              <h3 class="text-xl font-semibold">{{ 'LANDING.HOW.ITEM1.TITLE' | translate }}</h3>
              <p class="text-slate-400">{{ 'LANDING.HOW.ITEM1.DESC' | translate }}</p>
            </div>
            
            <div class="relative text-center space-y-4">
              <div class="w-24 h-24 mx-auto bg-slate-900 border-2 border-fuchsia-500 rounded-full flex items-center justify-center text-3xl font-bold shadow-[0_0_30px_-5px_rgba(217,70,239,0.4)]">2</div>
              <h3 class="text-xl font-semibold">{{ 'LANDING.HOW.ITEM2.TITLE' | translate }}</h3>
              <p class="text-slate-400">{{ 'LANDING.HOW.ITEM2.DESC' | translate }}</p>
            </div>
            
            <div class="relative text-center space-y-4">
              <div class="w-24 h-24 mx-auto bg-slate-900 border-2 border-pink-500 rounded-full flex items-center justify-center text-3xl font-bold shadow-[0_0_30px_-5px_rgba(236,72,153,0.4)]">3</div>
              <h3 class="text-xl font-semibold">{{ 'LANDING.HOW.ITEM3.TITLE' | translate }}</h3>
              <p class="text-slate-400">{{ 'LANDING.HOW.ITEM3.DESC' | translate }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing -->
      <section class="py-24 bg-slate-900 border-y border-white/5">
        <div class="max-w-6xl mx-auto px-6">
          <div class="text-center mb-16">
            <h2 class="text-3xl lg:text-4xl font-bold">{{ 'LANDING.PRICING.TITLE' | translate }}</h2>
            <p class="text-slate-400 mt-4">{{ 'LANDING.PRICING.DESC' | translate }}</p>
          </div>
          
          <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <!-- Free Plan -->
            <div class="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors">
              <h3 class="text-2xl font-bold mb-2">{{ 'LANDING.PRICING.FREE.TITLE' | translate }}</h3>
              <p class="text-slate-400 mb-6">{{ 'LANDING.PRICING.FREE.DESC' | translate }}</p>
              <div class="text-4xl font-extrabold mb-8">{{ 'LANDING.PRICING.FREE.PRICE' | translate }} <span class="text-lg font-medium text-slate-500">{{ 'LANDING.PRICING.FREE.MONTH' | translate }}</span></div>
              
              <ul class="space-y-4 mb-8 text-slate-300">
                <li class="flex items-center gap-3"><span class="text-emerald-400">✓</span> {{ 'LANDING.PRICING.FREE.F1' | translate }}</li>
                <li class="flex items-center gap-3"><span class="text-emerald-400">✓</span> {{ 'LANDING.PRICING.FREE.F2' | translate }}</li>
                <li class="flex items-center gap-3"><span class="text-emerald-400">✓</span> {{ 'LANDING.PRICING.FREE.F3' | translate }}</li>
              </ul>
              
              <a routerLink="/register" class="block w-full text-center py-3 rounded-xl bg-white/10 hover:bg-white/15 font-semibold transition-colors">
                {{ 'LANDING.PRICING.FREE.CTA' | translate }}
              </a>
            </div>
            
            <!-- Pro Plan -->
            <div class="bg-gradient-to-b from-violet-600/20 to-fuchsia-600/10 border border-violet-500/50 rounded-3xl p-8 relative transform md:-translate-y-4 shadow-2xl">
              <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">{{ 'LANDING.PRICING.PRO.BADGE' | translate }}</div>
              <h3 class="text-2xl font-bold mb-2">{{ 'LANDING.PRICING.PRO.TITLE' | translate }}</h3>
              <p class="text-violet-200 mb-6">{{ 'LANDING.PRICING.PRO.DESC' | translate }}</p>
              <div class="text-4xl font-extrabold mb-8">{{ 'LANDING.PRICING.PRO.PRICE' | translate }} <span class="text-lg font-medium text-violet-300">{{ 'LANDING.PRICING.PRO.MONTH' | translate }}</span></div>
              
              <ul class="space-y-4 mb-8 text-white">
                <li class="flex items-center gap-3"><span class="text-emerald-400">✓</span> {{ 'LANDING.PRICING.PRO.F1' | translate }}</li>
                <li class="flex items-center gap-3"><span class="text-emerald-400">✓</span> {{ 'LANDING.PRICING.PRO.F2' | translate }}</li>
                <li class="flex items-center gap-3"><span class="text-emerald-400">✓</span> {{ 'LANDING.PRICING.PRO.F3' | translate }}</li>
                <li class="flex items-center gap-3"><span class="text-emerald-400">✓</span> {{ 'LANDING.PRICING.PRO.F4' | translate }}</li>
              </ul>
              
              <a routerLink="/register" class="block w-full text-center py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition-colors shadow-lg">
                {{ 'LANDING.PRICING.PRO.CTA' | translate }}
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="py-12 border-t border-white/10">
        <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-white text-xs">
              W
            </div>
            <span class="font-semibold text-slate-300">Web Bio &copy; 2026</span>
          </div>
          
          <div class="flex gap-6">
            <a href="#" class="hover:text-white transition-colors">{{ 'LANDING.FOOTER.TERMS' | translate }}</a>
            <a href="#" class="hover:text-white transition-colors">{{ 'LANDING.FOOTER.PRIVACY' | translate }}</a>
            <a href="#" class="hover:text-white transition-colors">{{ 'LANDING.FOOTER.HELP' | translate }}</a>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class LandingPageComponent {
  protected readonly auth = inject(AuthService);
  protected readonly ts = inject(TranslationService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    effect(() => {
      const t = this.ts.t();
      this.title.setTitle(`Web Bio — ${t('LANDING.HERO.TITLE1')} ${t('LANDING.HERO.TITLE2')}`);
      this.meta.updateTag({ 
        name: 'description', 
        content: t('LANDING.HERO.DESC') 
      });
    });
  }

  toggleLanguage() {
    const newLang = this.ts.currentLang() === 'id' ? 'en' : 'id';
    this.ts.setLanguage(newLang).subscribe();
  }
}
