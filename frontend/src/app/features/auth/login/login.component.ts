import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BtnComponent } from '../../../shared/components/btn/btn.component';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, BtnComponent, TranslatePipe],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400 mb-2">
            WebBio
          </div>
          <p class="text-slate-400 text-sm">{{ 'AUTH.LOGIN.TITLE' | translate }}</p>
        </div>

        <!-- Card -->
        <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-300" for="email">{{ 'AUTH.LOGIN.EMAIL_LABEL' | translate }}</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                [placeholder]="'AUTH.LOGIN.EMAIL_PLACEHOLDER' | translate"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500
                       text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-300" for="password">{{ 'AUTH.LOGIN.PASSWORD_LABEL' | translate }}</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                [placeholder]="'AUTH.LOGIN.PASSWORD_PLACEHOLDER' | translate"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500
                       text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>

            @if (error()) {
              <p class="text-sm text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
                {{ error() }}
              </p>
            }

            <app-btn
              type="submit"
              [loading]="auth.loading()"
              [disabled]="form.invalid"
              [fullWidth]="true"
              size="lg"
            >
              {{ 'AUTH.LOGIN.BUTTON' | translate }}
            </app-btn>
          </form>

          <p class="text-center text-sm text-slate-400 mt-6">
            {{ 'AUTH.LOGIN.NO_ACCOUNT' | translate }}
            <a routerLink="/register" class="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              {{ 'AUTH.LOGIN.REGISTER_LINK' | translate }}
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  protected readonly auth = inject(AuthService);
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);

  error = signal('');

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => this.error.set(err.error?.error?.message ?? 'Login gagal'),
    });
  }
}
