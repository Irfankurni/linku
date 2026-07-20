import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { BtnComponent } from '../../../shared/components/btn/btn.component';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

const THEMES = [
  { id: 'default',  name: 'Default',  preview: 'from-slate-900 to-slate-800' },
  { id: 'violet',   name: 'Violet',   preview: 'from-violet-950 to-slate-900' },
  { id: 'rose',     name: 'Rose',     preview: 'from-rose-950 to-slate-900'   },
  { id: 'emerald',  name: 'Emerald',  preview: 'from-emerald-950 to-slate-900' },
  { id: 'amber',    name: 'Amber',    preview: 'from-amber-950 to-slate-900'  },
  { id: 'midnight', name: 'Midnight', preview: 'from-slate-950 to-black'      },
];

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
              (click)="!isFreePlan() && selectedTheme.set(theme.id)"
              [disabled]="isFreePlan()"
              class="rounded-xl overflow-hidden border-2 transition-all relative"
              [class]="selectedTheme() === theme.id ? 'border-violet-500 scale-105' : 'border-transparent hover:border-white/20'"
              [class.opacity-50]="isFreePlan()"
              [class.cursor-not-allowed]="isFreePlan()"
            >
              <div class="h-20 bg-gradient-to-br {{ theme.preview }}"></div>
              <div class="bg-white/5 px-3 py-2 text-left">
                <p class="text-xs font-medium text-white">{{ 'DASHBOARD.APPEARANCE.THEMES.' + theme.name.toUpperCase() | translate }}</p>
              </div>
              @if (isFreePlan() && theme.id !== 'default') {
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

      <!-- Profile info -->
      <div class="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
        <h2 class="text-base font-semibold text-white">{{ 'DASHBOARD.APPEARANCE.PROFILE_SECTION' | translate }}</h2>
        <form [formGroup]="form" (ngSubmit)="onSave()" class="space-y-3">
          <div class="space-y-1.5">
            <label class="text-xs text-slate-400">{{ 'DASHBOARD.APPEARANCE.DISPLAY_NAME' | translate }}</label>
            <input formControlName="display_name" type="text"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-slate-400">{{ 'DASHBOARD.APPEARANCE.BIO' | translate }}</label>
            <textarea formControlName="bio" rows="3"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"></textarea>
          </div>
          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <label class="text-xs text-slate-400">Custom Background URL</label>
              @if (isFreePlan()) {
                <span class="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">PRO</span>
              }
            </div>
            <input formControlName="background_url" type="url" placeholder="https://example.com/image.jpg"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-violet-500 transition disabled:opacity-50" />
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

  form = this.fb.group({
    display_name: [''],
    bio:          [''],
    background_url: [{ value: '', disabled: false }],
  });

  isFreePlan() {
    return this.userService.profile()?.plan === 'free';
  }

  ngOnInit() {
    const profile = this.userService.profile();
    if (profile) {
      this.form.patchValue({
        display_name: profile.display_name,
        bio: profile.bio ?? '',
        background_url: (profile.settings as any)?.background_url ?? ''
      });
      this.selectedTheme.set(profile.theme ?? 'default');
      if (this.isFreePlan()) {
        this.form.get('background_url')?.disable();
      }
    } else {
      this.userService.loadProfile().subscribe(res => {
        const p = res.data;
        this.form.patchValue({
          display_name: p.display_name,
          bio: p.bio ?? '',
          background_url: (p.settings as any)?.background_url ?? ''
        });
        this.selectedTheme.set(p.theme ?? 'default');
        if (this.isFreePlan()) {
          this.form.get('background_url')?.disable();
        }
      });
    }
  }

  onSave() {
    this.saving.set(true);
    const val = this.form.getRawValue();
    const settings = {
      ...this.userService.profile()?.settings,
      background_url: val.background_url ? val.background_url : undefined
    };

    this.userService.updateProfile({
      display_name: val.display_name ?? undefined,
      bio:          val.bio ?? undefined,
      theme:        this.isFreePlan() ? undefined : this.selectedTheme(),
      settings:     settings,
    }).subscribe({
      next:  () => { this.toast.success('Tampilan diperbarui!'); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }
}
