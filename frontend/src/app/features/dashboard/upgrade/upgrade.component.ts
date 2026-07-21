import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-8 pb-10">
      
      <!-- Header -->
      <div class="text-center space-y-3">
        <h1 class="text-3xl font-black text-white">Upgrade to Pro</h1>
        <p class="text-slate-400 max-w-lg mx-auto">
          Tingkatkan profil Linku kamu dengan fitur-fitur premium. Tampil lebih profesional dan dapatkan insight yang lebih dalam.
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-8">
        
        <!-- Free Tier -->
        <div class="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col relative transition-transform hover:scale-[1.02]">
          @if (isFreePlan()) {
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-xs font-bold px-3 py-1 rounded-full border border-slate-600">
              CURRENT PLAN
            </div>
          }
          <div class="mb-6">
            <h2 class="text-xl font-bold text-white mb-2">Free</h2>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-black text-white">Rp 0</span>
              <span class="text-slate-500 text-sm">/selamanya</span>
            </div>
            <p class="text-slate-400 text-sm mt-3">Untuk kamu yang baru mulai membangun personal branding.</p>
          </div>
          
          <ul class="space-y-4 mb-8 flex-1">
            <li class="flex items-start gap-3 text-sm text-slate-300">
              <span class="text-emerald-400 text-base leading-none">✓</span>
              <span>Link unlimited</span>
            </li>
            <li class="flex items-start gap-3 text-sm text-slate-300">
              <span class="text-emerald-400 text-base leading-none">✓</span>
              <span>Basic analytics (7 hari terakhir)</span>
            </li>
            <li class="flex items-start gap-3 text-sm text-slate-300">
              <span class="text-emerald-400 text-base leading-none">✓</span>
              <span>4 Tema gratis</span>
            </li>
            <li class="flex items-start gap-3 text-sm text-slate-300 opacity-50">
              <span class="text-slate-500 text-base leading-none">✕</span>
              <span>Custom background image</span>
            </li>
            <li class="flex items-start gap-3 text-sm text-slate-300 opacity-50">
              <span class="text-slate-500 text-base leading-none">✕</span>
              <span>Premium themes</span>
            </li>
            <li class="flex items-start gap-3 text-sm text-slate-300 opacity-50">
              <span class="text-slate-500 text-base leading-none">✕</span>
              <span>Advanced analytics</span>
            </li>
          </ul>

          <button 
            disabled
            class="w-full py-3 rounded-xl font-semibold bg-white/5 text-slate-400 border border-white/10 cursor-not-allowed">
            Saat ini aktif
          </button>
        </div>

        <!-- Pro Tier -->
        <div class="bg-gradient-to-b from-violet-900/40 to-slate-900 border border-violet-500/30 rounded-3xl p-8 flex flex-col relative ring-1 ring-violet-500/20 transition-transform hover:scale-[1.02]">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-violet-500/20">
            RECOMMENDED
          </div>
          <div class="mb-6">
            <h2 class="text-xl font-bold text-violet-300 mb-2">Pro</h2>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-black text-white">Rp 20.000</span>
              <span class="text-slate-400 text-sm">/bulan</span>
            </div>
            <p class="text-violet-200/70 text-sm mt-3">Untuk profesional dan kreator yang ingin tampil lebih menonjol.</p>
          </div>
          
          <ul class="space-y-4 mb-8 flex-1">
            <li class="flex items-start gap-3 text-sm text-slate-200">
              <span class="text-violet-400 text-base leading-none">✓</span>
              <span>Semua fitur Free</span>
            </li>
            <li class="flex items-start gap-3 text-sm text-slate-200">
              <span class="text-violet-400 text-base leading-none">✓</span>
              <span><strong class="text-white">Custom background image</strong></span>
            </li>
            <li class="flex items-start gap-3 text-sm text-slate-200">
              <span class="text-violet-400 text-base leading-none">✓</span>
              <span><strong class="text-white">Semua Premium themes</strong> terbuka</span>
            </li>
            <li class="flex items-start gap-3 text-sm text-slate-200">
              <span class="text-violet-400 text-base leading-none">✓</span>
              <span><strong class="text-white">Advanced analytics</strong> (Geo & Devices)</span>
            </li>
            <li class="flex items-start gap-3 text-sm text-slate-200">
              <span class="text-violet-400 text-base leading-none">✓</span>
              <span>Data history hingga 90 hari</span>
            </li>
          </ul>

          <button 
            (click)="onUpgradeClick()"
            [disabled]="!isFreePlan()"
            [class]="isFreePlan() 
              ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-lg shadow-violet-500/25' 
              : 'bg-white/5 text-slate-400 border border-white/10 cursor-not-allowed'"
            class="w-full py-3 rounded-xl font-bold transition-all duration-200">
            {{ isFreePlan() ? 'Upgrade ke Pro Sekarang' : 'Kamu sudah Pro!' }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class UpgradeComponent {
  private readonly userService = inject(UserService);

  isFreePlan() {
    return this.userService.profile()?.plan === 'free';
  }

  onUpgradeClick() {
    // Mock upgrade action as requested
    alert('Fitur upgrade (mock) diklik! Pembayaran akan diintegrasikan di sini nanti.');
  }
}
