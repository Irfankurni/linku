import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { BtnComponent } from '../../../shared/components/btn/btn.component';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

import { THEMES } from '../../../core/constants/themes';

@Component({
  selector: 'app-appearance',
  standalone: true,
  imports: [ReactiveFormsModule, BtnComponent, TranslatePipe],
  template: `
    <div class="max-w-2xl space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-white">{{ 'DASHBOARD.APPEARANCE.TITLE' | translate }}</h1>
        <p class="text-slate-400 text-sm mt-1">{{ 'DASHBOARD.APPEARANCE.SUBTITLE' | translate }}</p>
      </div>

      <!-- Theme picker -->
      <div class="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-white">{{ 'DASHBOARD.APPEARANCE.THEME_SECTION' | translate }}</h2>
          @if (isFreePlan()) {
            <span class="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded">PRO</span>
          }
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          @for (theme of themes; track theme.id) {
            <button
              (click)="(!isFreePlan() || !theme.isPro) && selectedTheme.set(theme.id)"
              [disabled]="isFreePlan() && theme.isPro"
              class="rounded-xl overflow-hidden border-2 transition-all relative"
              [class]="selectedTheme() === theme.id ? 'border-violet-500 scale-105' : 'border-transparent hover:border-white/20'"
              [class.opacity-50]="isFreePlan() && theme.isPro"
              [class.cursor-not-allowed]="isFreePlan() && theme.isPro"
            >
              <div class="h-20 bg-gradient-to-br {{ theme.preview }}"></div>
              <div class="bg-white/5 px-3 py-2 text-left">
                <p class="text-xs font-medium text-white">{{ 'DASHBOARD.APPEARANCE.THEMES.' + theme.name.toUpperCase() | translate }}</p>
              </div>
              @if (isFreePlan() && theme.isPro) {
                <div class="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span class="text-xl">🔒</span>
                </div>
              }
            </button>
          }
        </div>
        @if (isFreePlan()) {
          <p class="text-xs text-slate-400">Upgrade ke Pro untuk membuka kustomisasi tema.</p>
        }
      </div>

      <!-- Background -->
      <div class="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-white">Background</h2>
          @if (isFreePlan()) {
            <span class="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">PRO</span>
          }
        </div>
        <form [formGroup]="form" (ngSubmit)="onSave()" class="space-y-3">
          <div class="space-y-1.5">
            <label class="text-xs text-slate-400">Custom Background URL</label>
            <div class="flex items-center gap-3">
              <input formControlName="background_url" type="url" placeholder="https://example.com/image.jpg"
                class="flex-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-violet-500 transition disabled:opacity-50" />
              <input type="file" #bgInput class="hidden" accept="image/*" (change)="onBgUpload($event)" />
              <button type="button" (click)="bgInput.click()" [disabled]="isFreePlan() || bgUploading()"
                class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition disabled:opacity-50 whitespace-nowrap flex items-center gap-2">
                @if (bgUploading()) {
                  <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                }
                Upload
              </button>
            </div>
          </div>
          <div class="flex justify-end">
            <app-btn type="submit" size="sm" [loading]="saving()">{{ 'DASHBOARD.APPEARANCE.BTN_SAVE' | translate }}</app-btn>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AppearanceComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly toast       = inject(ToastService);
  private readonly fb          = inject(FormBuilder);

  themes        = THEMES;
  selectedTheme = signal('default');
  saving        = signal(false);
  bgUploading   = signal(false);

  form = this.fb.group({
    background_url: [{ value: '', disabled: false }],
  });

  isFreePlan() {
    return this.userService.profile()?.plan === 'free';
  }

  ngOnInit() {
    const profile = this.userService.profile();
    if (profile) {
      this._patchForm(profile);
    } else {
      this.userService.loadProfile().subscribe(res => this._patchForm(res.data));
    }
  }

  private _patchForm(profile: any) {
    this.form.patchValue({
      background_url: (profile.settings as any)?.background_url ?? ''
    });
    this.selectedTheme.set(profile.theme ?? 'default');
    if (this.isFreePlan()) {
      this.form.get('background_url')?.disable();
    }
  }

  onSave() {
    this.saving.set(true);
    const val = this.form.getRawValue();
    const settings = {
      ...this.userService.profile()?.settings,
      background_url: val.background_url ? val.background_url : undefined
    };

    const selected = this.themes.find(t => t.id === this.selectedTheme());
    const isProTheme = selected?.isPro ?? false;

    this.userService.updateProfile({
      theme:    (this.isFreePlan() && isProTheme) ? undefined : this.selectedTheme(),
      settings: settings,
    }).subscribe({
      next:  () => { this.toast.success('Tampilan diperbarui!'); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  onBgUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.bgUploading.set(true);
    this.userService.uploadImage(file).subscribe({
      next: (res) => {
        this.form.patchValue({ background_url: res.data.url });
        this.bgUploading.set(false);
        this.toast.success('Image berhasil diupload! Klik Simpan Perubahan untuk mengaktifkan.');
      },
      error: () => {
        this.bgUploading.set(false);
        this.toast.error('Gagal mengupload image');
      }
    });
  }
}
