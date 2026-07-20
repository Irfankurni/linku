import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BtnComponent } from '../../../shared/components/btn/btn.component';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, BtnComponent, TranslatePipe],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <div class="text-center mb-8">
          <div class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400 mb-2">
            WebBio
          </div>
          <p class="text-slate-400 text-sm">{{ 'AUTH.REGISTER.TITLE' | translate }}</p>
        </div>

        <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-300" for="display_name">{{ 'AUTH.REGISTER.DISPLAY_NAME_LABEL' | translate }}</label>
              <input id="display_name" type="text" formControlName="display_name" [placeholder]="'AUTH.REGISTER.DISPLAY_NAME_PLACEHOLDER' | translate"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500
                       text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition" />
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-300" for="username">{{ 'AUTH.REGISTER.USERNAME_LABEL' | translate }}</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                <input id="username" type="text" formControlName="username" [placeholder]="'AUTH.REGISTER.USERNAME_PLACEHOLDER' | translate"
                  class="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white placeholder-slate-500
                         text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition" />
              </div>
              <p class="text-xs text-slate-500">{{ environment.frontendUrl }}/@{{ form.get('username')?.value || ('AUTH.REGISTER.USERNAME_PLACEHOLDER' | translate) }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-300" for="reg-email">{{ 'AUTH.REGISTER.EMAIL_LABEL' | translate }}</label>
              <input id="reg-email" type="email" formControlName="email" [placeholder]="'AUTH.REGISTER.EMAIL_PLACEHOLDER' | translate"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500
                       text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition" />
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-300" for="reg-password">{{ 'AUTH.REGISTER.PASSWORD_LABEL' | translate }}</label>
              <input id="reg-password" type="password" formControlName="password" [placeholder]="'AUTH.REGISTER.PASSWORD_PLACEHOLDER' | translate"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500
                       text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition" />
            </div>

            @if (error()) {
              <p class="text-sm text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
                {{ error() }}
              </p>
            }

            <app-btn type="submit" [loading]="auth.loading()" [disabled]="form.invalid" [fullWidth]="true" size="lg">
              {{ 'AUTH.REGISTER.BUTTON' | translate }}
            </app-btn>
          </form>

          <p class="text-center text-sm text-slate-400 mt-6">
            {{ 'AUTH.REGISTER.HAS_ACCOUNT' | translate }}
            <a routerLink="/login" class="text-violet-400 hover:text-violet-300 font-medium transition-colors">{{ 'AUTH.REGISTER.LOGIN_LINK' | translate }}</a>
          </p>
        </div>
      </div>
    </div>
  `,
})

export class RegisterComponent {
  protected readonly environment = environment;
  protected readonly auth = inject(AuthService);
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);

  error = signal('');

  form = this.fb.group({
    display_name: ['', [Validators.required, Validators.maxLength(80)]],
    username:     ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32),
                        Validators.pattern(/^[a-z0-9_-]+$/)]],
    email:        ['', [Validators.required, Validators.email]],
    password:     ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.error.set('');
    const val = this.form.getRawValue();
    this.auth.register({
      display_name: val.display_name!,
      username:     val.username!,
      email:        val.email!,
      password:     val.password!,
    }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => this.error.set(err.error?.error?.message ?? 'Pendaftaran gagal'),
    });
  }
}
