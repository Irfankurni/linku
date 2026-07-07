import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { BtnComponent } from '../../../shared/components/btn/btn.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonCardComponent } from '../../../shared/components/skeleton/skeleton.component';
import type { Product } from '../../../core/models/product.model';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-product-list',
  imports: [ReactiveFormsModule, BtnComponent, EmptyStateComponent, SkeletonCardComponent, DecimalPipe, TranslatePipe],
  template: `
    <div class="max-w-4xl space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">{{ 'DASHBOARD.PRODUCTS.TITLE' | translate }}</h1>
          <p class="text-slate-400 text-sm mt-1">
            {{ 'DASHBOARD.PRODUCTS.USAGE' | translate:{'current': productService.products().length.toString(), 'limit': '5'} }}
          </p>
        </div>
        <app-btn (click)="showForm.set(!showForm())" variant="primary" size="sm">
          {{ showForm() ? ('DASHBOARD.PRODUCTS.CANCEL_BTN' | translate) : ('DASHBOARD.PRODUCTS.ADD_BTN' | translate) }}
        </app-btn>
      </div>

      <!-- Add/Edit form -->
      @if (showForm()) {
        <div class="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
          <h2 class="text-base font-semibold text-white">{{ editingId() ? ('DASHBOARD.PRODUCTS.EDIT' | translate) : ('DASHBOARD.PRODUCTS.ADD_NEW' | translate) }}</h2>
          <form [formGroup]="form" (ngSubmit)="onSave()" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input formControlName="title" type="text" [placeholder]="'DASHBOARD.PRODUCTS.FORM.TITLE' | translate"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm
                       focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
              <input formControlName="slug" type="text" placeholder="slug-produk *"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm
                       focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
            </div>
            <textarea formControlName="description" rows="3" [placeholder]="'DASHBOARD.PRODUCTS.FORM.DESC' | translate"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm
                     focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"></textarea>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input formControlName="price" type="number" [placeholder]="'DASHBOARD.PRODUCTS.FORM.PRICE' | translate"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm
                       focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
              <input formControlName="buy_url" type="url" [placeholder]="'DASHBOARD.PRODUCTS.FORM.URL' | translate"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm
                       focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
            </div>
            <div class="flex gap-3 justify-end">
              <app-btn type="button" variant="ghost" size="sm" (click)="cancelForm()">{{ 'DASHBOARD.PRODUCTS.FORM.CANCEL' | translate }}</app-btn>
              <app-btn type="submit" size="sm" [loading]="saving()" [disabled]="form.invalid">
                {{ editingId() ? ('DASHBOARD.PRODUCTS.FORM.SAVE' | translate) : ('DASHBOARD.PRODUCTS.FORM.ADD' | translate) }}
              </app-btn>
            </div>
          </form>
        </div>
      }

      <!-- Product grid -->
      @if (productService.loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          @for (i of [1,2]; track i) { <app-skeleton-card /> }
        </div>
      } @else if (productService.products().length === 0) {
        <app-empty-state
          icon="📦"
          [title]="'DASHBOARD.PRODUCTS.EMPTY.TITLE' | translate"
          [description]="'DASHBOARD.PRODUCTS.EMPTY.DESC' | translate"
        >
          <app-btn (click)="showForm.set(true)" size="sm">{{ 'DASHBOARD.PRODUCTS.EMPTY.BTN' | translate }}</app-btn>
        </app-empty-state>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          @for (product of productService.products(); track product.id) {
            <div class="group rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all overflow-hidden">
              <!-- Image -->
              @if (product.images.length > 0) {
                <img [src]="product.images[0]" [alt]="product.title"
                     class="w-full h-40 object-cover" />
              } @else {
                <div class="w-full h-40 bg-white/5 flex items-center justify-center text-4xl">📦</div>
              }

              <div class="p-4 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-sm font-semibold text-white">{{ product.title }}</h3>
                  @if (!product.is_active) {
                    <span class="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full shrink-0">Nonaktif</span>
                  }
                </div>
                @if (product.price !== null) {
                  <p class="text-violet-400 text-sm font-bold">Rp {{ product.price | number }}</p>
                } @else {
                  <p class="text-slate-400 text-sm">Hubungi untuk harga</p>
                }
                <p class="text-xs text-slate-500">{{ 'DASHBOARD.PRODUCTS.ITEM.CLICKS' | translate:{'count': product.view_count.toString()} }}</p>
                <div class="flex gap-2 pt-1">
                  <app-btn (click)="editProduct(product)" size="sm" variant="ghost" class="flex-1">{{ 'DASHBOARD.PRODUCTS.ITEM.BTN_EDIT' | translate }}</app-btn>
                  <app-btn (click)="toggleProduct(product)" size="sm" variant="secondary" class="flex-1">
                    {{ product.is_active ? 'Nonaktifkan' : 'Aktifkan' }}
                  </app-btn>
                  <app-btn (click)="deleteProduct(product.id)" size="sm" variant="danger">{{ 'DASHBOARD.PRODUCTS.ITEM.BTN_DELETE' | translate }}</app-btn>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ProductListComponent implements OnInit {
  protected readonly productService = inject(ProductService);
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  showForm = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);

  form = this.fb.group({
    title: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: [''],
    price: [null as number | null],
    buy_url: [''],
  });

  ngOnInit() {
    this.productService.loadProducts().subscribe();
  }

  editProduct(p: Product) {
    this.editingId.set(p.id);
    this.form.patchValue({ title: p.title, slug: p.slug, description: p.description ?? '', price: p.price, buy_url: p.buy_url ?? '' });
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  onSave() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const val = this.form.getRawValue();
    const dto = {
      title: val.title!,
      slug: val.slug!,
      description: val.description || undefined,
      price: val.price ?? null,
      buy_url: val.buy_url || null,
    };

    const id = this.editingId();
    const obs = id
      ? this.productService.updateProduct(id, dto)
      : this.productService.createProduct(dto);

    obs.subscribe({
      next: () => { this.toast.success(id ? 'Produk diperbarui!' : 'Produk ditambahkan!'); this.cancelForm(); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  toggleProduct(p: Product) {
    this.productService.toggleActive(p.id).subscribe({
      next: () => this.toast.success(`Produk ${p.is_active ? 'dinonaktifkan' : 'diaktifkan'}`),
    });
  }

  deleteProduct(id: string) {
    if (!confirm('Hapus produk ini?')) return;
    this.productService.deleteProduct(id).subscribe({
      next: () => this.toast.success('Produk dihapus'),
    });
  }
}
