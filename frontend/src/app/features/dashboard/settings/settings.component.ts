import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { BtnComponent } from '../../../shared/components/btn/btn.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../core/i18n/translation.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, BtnComponent, BadgeComponent, TranslatePipe],
  template: `
    <div class="max-w-2xl space-y-6">
      <h1 class="text-2xl font-bold text-white">{{ 'DASHBOARD.SETTINGS.TITLE' | translate }}</h1>

      <!-- Profile section -->
      <div class="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
        <h2 class="text-base font-semibold text-white">{{ 'DASHBOARD.SETTINGS.PROFILE' | translate }}</h2>
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-3">
          <div class="space-y-1.5">
            <label class="text-xs text-slate-400">{{ 'DASHBOARD.SETTINGS.DISPLAY_NAME' | translate }}</label>
            <input formControlName="display_name" type="text"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-slate-400">{{ 'DASHBOARD.SETTINGS.BIO' | translate }}</label>
            <textarea formControlName="bio" rows="2"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"></textarea>
          </div>
          <div class="flex justify-end">
            <app-btn type="submit" size="sm" [loading]="savingProfile()">{{ 'DASHBOARD.SETTINGS.SAVE_PROFILE' | translate }}</app-btn>
          </div>
        </form>
      </div>

      <!-- Plan section -->
      <div class="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-white">{{ 'DASHBOARD.SETTINGS.CURRENT_PLAN' | translate }}</h2>
          @if (userService.profile(); as profile) {
            <app-badge [plan]="profile.plan" />
          }
        </div>

        @if (userService.planInfo(); as planInfo) {
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-white/5 rounded-xl p-3">
              <p class="text-slate-400 text-xs">{{ 'DASHBOARD.SETTINGS.MAX_LINKS' | translate }}</p>
              <p class="text-white font-semibold">{{ planInfo.limits.links === -1 ? ('DASHBOARD.SETTINGS.UNLIMITED' | translate) : planInfo.limits.links }}</p>
            </div>
            <div class="bg-white/5 rounded-xl p-3">
              <p class="text-slate-400 text-xs">{{ 'DASHBOARD.SETTINGS.MAX_PRODUCTS' | translate }}</p>
              <p class="text-white font-semibold">{{ planInfo.limits.products === -1 ? ('DASHBOARD.SETTINGS.UNLIMITED' | translate) : planInfo.limits.products }}</p>
            </div>
            <div class="bg-white/5 rounded-xl p-3">
              <p class="text-slate-400 text-xs">{{ 'DASHBOARD.SETTINGS.ANALYTICS' | translate }}</p>
              <p class="text-white font-semibold">{{ planInfo.limits.analytics_days }} {{ 'DASHBOARD.SETTINGS.DAYS' | translate }}</p>
            </div>
            <div class="bg-white/5 rounded-xl p-3">
              <p class="text-slate-400 text-xs">{{ 'DASHBOARD.SETTINGS.GEO_ANALYTICS' | translate }}</p>
              <p class="text-white font-semibold">{{ planInfo.limits.geo_analytics ? ('DASHBOARD.SETTINGS.YES' | translate) : ('DASHBOARD.SETTINGS.NO' | translate) }}</p>
            </div>
          </div>
        }

        @if (userService.profile()?.plan === 'free') {
          <div class="mt-4 p-4 rounded-xl bg-violet-950/50 border border-violet-500/30 text-center space-y-3">
            <p class="text-sm text-slate-300" [innerHTML]="'DASHBOARD.SETTINGS.UPGRADE_PRO' | translate"></p>
            <div class="bg-slate-800 border border-white/10 rounded-xl p-3 text-xs text-slate-400">
              {{ 'DASHBOARD.SETTINGS.MANUAL_UPGRADE' | translate }}
            </div>
          </div>
        }
      </div>

      <!-- Danger zone -->
      <div class="rounded-2xl bg-red-950/20 border border-red-900/40 p-6 space-y-3">
        <h2 class="text-base font-semibold text-red-400">{{ 'DASHBOARD.SETTINGS.DANGER_ZONE' | translate }}</h2>
        <p class="text-sm text-slate-400">{{ 'DASHBOARD.SETTINGS.DEACTIVATE_DESC' | translate }}</p>
        <app-btn variant="danger" size="sm" (click)="deactivateAccount()">{{ 'DASHBOARD.SETTINGS.DEACTIVATE_ACCOUNT' | translate }}</app-btn>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  protected readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly ts = inject(TranslationService);

  savingProfile = signal(false);

  profileForm = this.fb.group({
    display_name: ['', Validators.required],
    bio: [''],
  });

  ngOnInit() {
    this.userService.loadPlanInfo().subscribe();
    const profile = this.userService.profile();
    if (profile) {
      this.profileForm.patchValue({ display_name: profile.display_name, bio: profile.bio ?? '' });
    } else {
      this.userService.loadProfile().subscribe(res => {
        this.profileForm.patchValue({ display_name: res.data.display_name, bio: res.data.bio ?? '' });
      });
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true);
    const val = this.profileForm.getRawValue();
    this.userService.updateProfile({ display_name: val.display_name!, bio: val.bio ?? undefined }).subscribe({
      next: () => { this.toast.success(this.ts.t()('DASHBOARD.SETTINGS.SAVE_PROFILE')); this.savingProfile.set(false); },
      error: () => this.savingProfile.set(false),
    });
  }

  deactivateAccount() {
    if (!confirm(this.ts.t()('DASHBOARD.SETTINGS.DEACTIVATE_DESC'))) return;
    this.userService.deleteAccount().subscribe({
      next: () => this.auth.logout().subscribe(),
    });
  }
}
