import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AnalyticsService } from '../../core/services/analytics.service';
import { environment } from '../../../environments/environment';
import type { Product } from '../../core/models/product.model';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-product-detail',
  imports: [DecimalPipe, TranslatePipe],
  template: `
    <div class="min-h-screen bg-slate-950 text-white">
      @if (loading()) {
        <div class="flex items-center justify-center min-h-screen">
          <div class="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (product()) {
        <div class="max-w-xl mx-auto px-4 py-12 space-y-6">
          <!-- Images -->
          @if (product()!.images.length > 0) {
            <img [src]="product()!.images[0]" [alt]="product()!.title"
                 class="w-full rounded-2xl object-cover max-h-80" />
          }

          <div class="space-y-4">
            <h1 class="text-2xl font-bold">{{ product()!.title }}</h1>

            @if (product()!.price !== null) {
              <p class="text-3xl font-black text-violet-400">Rp {{ product()!.price | number }}</p>
            }

            @if (product()!.description) {
              <p class="text-slate-300 text-sm leading-relaxed">{{ product()!.description }}</p>
            }

            @if (product()!.stock !== null) {
              <p class="text-xs text-slate-500">{{ 'PRODUCT.STOCK' | translate }} {{ product()!.stock }}</p>
            }

            @if (product()!.buy_url) {
              <a
                [href]="product()!.buy_url"
                target="_blank"
                rel="noopener noreferrer"
                (click)="trackBuyClick()"
                class="block w-full text-center py-4 rounded-2xl bg-violet-600 hover:bg-violet-500
                       font-bold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {{ 'PRODUCT.BUY_NOW' | translate }}
              </a>
            }
          </div>

          <div class="pt-4 text-center">
            <a [href]="'/' + username()" class="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              {{ 'PRODUCT.BACK_TO_PROFILE' | translate:{ username: username() } }}
            </a>
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
          <p class="text-5xl">📦</p>
          <h1 class="text-xl font-bold">{{ 'PRODUCT.NOT_FOUND' | translate }}</h1>
        </div>
      }
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly analyticsService = inject(AnalyticsService);

  loading = signal(true);
  product = signal<Product | null>(null);
  username = signal('');

  ngOnInit() {
    const u = this.route.snapshot.paramMap.get('username') ?? '';
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.username.set(u);

    this.http
      .get<{ success: boolean; data: Product }>(`${environment.apiBaseUrl}/p/${u}/products/${slug}`)
      .subscribe({
        next: res => { this.product.set(res.data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  trackBuyClick() {
    const p = this.product();
    if (!p) return;
    this.analyticsService.track(this.username(), { entity_type: 'product', entity_id: p.id, event: 'buy_click' });
  }
}
