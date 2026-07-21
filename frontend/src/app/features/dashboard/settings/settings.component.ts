import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
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
  imports: [ReactiveFormsModule, BtnComponent, BadgeComponent, TranslatePipe, UpperCasePipe],
  template: `
    <div class="max-w-2xl space-y-6">
      <h1 class="text-2xl font-bold text-white">{{ 'DASHBOARD.SETTINGS.TITLE' | translate }}</h1>

      <!-- Profile section -->
      <div class="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-5">
        <h2 class="text-base font-semibold text-white">{{ 'DASHBOARD.SETTINGS.PROFILE' | translate }}</h2>

        <!-- Avatar Upload -->
        <div class="flex items-center gap-4">
          <div class="relative w-16 h-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20 shrink-0">
            @if (avatarUrl()) {
              <img [src]="avatarUrl()" class="w-full h-full object-cover" alt="Avatar" />
            } @else {
              <span class="text-xl text-white font-semibold">
                {{ (profileForm.value.display_name?.charAt(0) || 'U') | uppercase }}
              </span>
            }
            @if (avatarUploading()) {
              <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              </div>
            }
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-white">Avatar</p>
            <p class="text-xs text-slate-400">JPG, PNG, or GIF · max 5 MB</p>
            <input type="file" #avatarInput class="hidden" accept="image/*" (change)="onAvatarUpload($event)" />
            <button
              type="button"
              (click)="avatarInput.click()"
              [disabled]="avatarUploading()"
              class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
            >
              {{ avatarUploading() ? 'Uploading…' : 'Change Avatar' }}
            </button>
          </div>
        </div>

        <!-- Display name & bio form -->
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

  savingProfile   = signal(false);
  avatarUrl       = signal<string | null>(null);
  avatarUploading = signal(false);

  profileForm = this.fb.group({
    display_name: ['', Validators.required],
    bio: [''],
  });

  ngOnInit() {
    this.userService.loadPlanInfo().subscribe();
    const profile = this.userService.profile();
    if (profile) {
      this._patchForm(profile);
    } else {
      this.userService.loadProfile().subscribe(res => this._patchForm(res.data));
    }
  }

  private _patchForm(profile: any) {
    this.profileForm.patchValue({
      display_name: profile.display_name,
      bio: profile.bio ?? '',
    });
    this.avatarUrl.set(profile.avatar_url ?? null);
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

  onAvatarUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.avatarUploading.set(true);
    this.userService.uploadImage(file).subscribe({
      next: (res) => {
        this.avatarUrl.set(res.data.url);
        this.userService.updateProfile({ avatar_url: res.data.url }).subscribe();
        this.avatarUploading.set(false);
        this.toast.success('Avatar berhasil diperbarui!');
      },
      error: () => {
        this.avatarUploading.set(false);
        this.toast.error('Gagal mengupload avatar');
      }
    });
  }

  deactivateAccount() {
    if (!confirm(this.ts.t()('DASHBOARD.SETTINGS.DEACTIVATE_DESC'))) return;
    this.userService.deleteAccount().subscribe({
      next: () => this.auth.logout().subscribe(),
    });
  }
}
