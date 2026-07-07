import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, submit, required, maxLength, pattern } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { LinkService } from '../../../core/services/link.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { BtnComponent } from '../../../shared/components/btn/btn.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonCardComponent } from '../../../shared/components/skeleton/skeleton.component';
import type { Link } from '../../../core/models/link.model';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

const AVAILABLE_ICONS = [
  { name: 'Tanpa Ikon', url: null },
  { name: 'Instagram', url: 'https://cdn.simpleicons.org/instagram/white' },
  { name: 'TikTok', url: 'https://cdn.simpleicons.org/tiktok/white' },
  { name: 'YouTube', url: 'https://cdn.simpleicons.org/youtube/white' },
  { name: 'Facebook', url: 'https://cdn.simpleicons.org/facebook/white' },
  { name: 'X (Twitter)', url: 'https://cdn.simpleicons.org/x/white' },
  { name: 'WhatsApp', url: 'https://cdn.simpleicons.org/whatsapp/white' },
  { name: 'Telegram', url: 'https://cdn.simpleicons.org/telegram/white' },
  { name: 'Shopee', url: 'https://cdn.simpleicons.org/shopee/white' },
  { name: 'Tokopedia', url: 'https://cdn.simpleicons.org/tokopedia/white' },
  { name: 'Shopify', url: 'https://cdn.simpleicons.org/shopify/white' },
  { name: 'Amazon', url: 'https://cdn.simpleicons.org/amazon/white' },
];

@Component({
  selector: 'app-link-list',
  standalone: true,
  imports: [FormField, BtnComponent, EmptyStateComponent, SkeletonCardComponent, TranslatePipe],
  template: `
    <div class="max-w-2xl space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">{{ 'DASHBOARD.LINKS.TITLE' | translate }}</h1>
          <p class="text-slate-400 text-sm mt-1">
            {{ 'DASHBOARD.LINKS.USAGE' | translate:{'current': linkService.links().length.toString(), 'limit': planLimit().toString()} }}
          </p>
        </div>
        <app-btn (click)="showForm.set(!showForm())" variant="primary" size="sm">
          {{ showForm() ? ('DASHBOARD.LINKS.CANCEL_BTN' | translate) : ('DASHBOARD.LINKS.ADD_BTN' | translate) }}
        </app-btn>
      </div>

      <!-- Add/Edit form -->
      @if (showForm()) {
        <div class="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
          <h2 class="text-base font-semibold text-white">{{ editingId() ? ('DASHBOARD.LINKS.EDIT' | translate) : ('DASHBOARD.LINKS.ADD_NEW' | translate) }}</h2>
          <form (submit)="onSave(); $event.preventDefault()" class="space-y-3">
            <input [formField]="linkForm.title" type="text" [placeholder]="'DASHBOARD.LINKS.FORM.TITLE' | translate"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm
                     focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
            <input [formField]="linkForm.url" type="url" [placeholder]="'DASHBOARD.LINKS.FORM.URL' | translate"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm
                     focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
            <textarea [formField]="linkForm.description" rows="2" [placeholder]="'DASHBOARD.LINKS.FORM.DESC' | translate"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm
                     focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"></textarea>
            <select [formField]="linkForm.icon_url"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm
                     focus:outline-none focus:ring-2 focus:ring-violet-500 transition appearance-none">
              @for (icon of icons; track icon.name) {
                <option [value]="icon.url || ''" class="bg-slate-900 text-white">{{ icon.name }}</option>
              }
            </select>
            <div class="flex gap-3 justify-end">
              <app-btn type="button" variant="ghost" size="sm" (click)="cancelForm()">{{ 'DASHBOARD.LINKS.FORM.CANCEL' | translate }}</app-btn>
              <app-btn type="submit" size="sm" [loading]="saving()" [disabled]="linkForm().invalid()">
                {{ editingId() ? ('DASHBOARD.LINKS.FORM.SAVE' | translate) : ('DASHBOARD.LINKS.FORM.ADD' | translate) }}
              </app-btn>
            </div>
          </form>
        </div>
      }

      <!-- Link list -->
      @if (linkService.loading()) {
        @for (i of [1,2,3]; track i) {
          <app-skeleton-card />
        }
      } @else if (linkService.links().length === 0) {
        <app-empty-state
          icon="⛓"
          [title]="'DASHBOARD.LINKS.EMPTY.TITLE' | translate"
          [description]="'DASHBOARD.LINKS.EMPTY.DESC' | translate"
        >
          <app-btn (click)="showForm.set(true)" size="sm">{{ 'DASHBOARD.LINKS.EMPTY.BTN' | translate }}</app-btn>
        </app-empty-state>
      } @else {
        <div class="space-y-3">
          @for (link of linkService.links(); track link.id) {
            <div
              class="group flex items-center gap-4 rounded-2xl bg-white/5 border border-white/10 px-5 py-4
                     hover:border-white/20 transition-all duration-200"
            >
              <!-- Drag handle -->
              <span class="text-slate-600 cursor-grab select-none text-lg">⠿</span>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-semibold text-white truncate">{{ link.title }}</p>
                  @if (link.is_featured) {
                    <span class="text-xs bg-amber-900/40 text-amber-400 border border-amber-800/40 px-1.5 py-0.5 rounded-full">{{ 'DASHBOARD.LINKS.ITEM.FEATURED' | translate }}</span>
                  }
                </div>
                <p class="text-xs text-slate-500 truncate mt-0.5">{{ link.url }}</p>
              </div>

              <!-- Icon Preview -->
              @if (link.icon_url) {
                <img [src]="link.icon_url" alt="Icon" class="w-6 h-6 object-contain opacity-80" />
              }

              <!-- Click count -->
              <span class="text-xs text-slate-500 shrink-0">{{ 'DASHBOARD.LINKS.ITEM.CLICKS' | translate:{'count': link.click_count.toString()} }}</span>

              <!-- Actions -->
              <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button (click)="editLink(link)"
                  class="text-xs px-2.5 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-slate-300 transition">
                  {{ 'DASHBOARD.LINKS.ITEM.BTN_EDIT' | translate }}
                </button>
                <button (click)="toggleLink(link)"
                  class="text-xs px-2.5 py-1.5 rounded-lg transition"
                  [class]="link.is_active
                    ? 'bg-emerald-900/40 hover:bg-emerald-900/70 text-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'"
                >
                  {{ link.is_active ? ('DASHBOARD.LINKS.ITEM.BTN_ACTIVE' | translate) : ('DASHBOARD.LINKS.ITEM.BTN_INACTIVE' | translate) }}
                </button>
                <button (click)="deleteLink(link.id)"
                  class="text-xs px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 transition">
                  {{ 'DASHBOARD.LINKS.ITEM.BTN_DELETE' | translate }}
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class LinkListComponent implements OnInit {
  protected readonly linkService  = inject(LinkService);
  protected readonly userService  = inject(UserService);
  private readonly toast          = inject(ToastService);

  showForm  = signal(false);
  editingId = signal<string | null>(null);
  saving    = signal(false);

  planLimit = signal(10); // Will be set from plan info
  icons     = AVAILABLE_ICONS;

  linkModel = signal({
    title: '',
    url: '',
    description: '',
    icon_url: ''
  });

  linkForm = form(this.linkModel, (s) => {
    required(s.title);
    maxLength(s.title, 100);
    required(s.url);
    pattern(s.url, /^https?:\/\/.+/);
  });

  ngOnInit() {
    this.linkService.loadLinks().subscribe();
  }

  editLink(link: Link) {
    this.editingId.set(link.id);
    this.linkModel.set({ title: link.title, url: link.url, description: link.description ?? '', icon_url: link.icon_url ?? '' });
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.linkModel.set({ title: '', url: '', description: '', icon_url: '' });
    this.linkForm().reset();
  }

  onSave() {
    submit(this.linkForm, async () => {
      this.saving.set(true);
      const val = this.linkModel();
      const dto = { title: val.title, url: val.url, description: val.description || undefined, icon_url: val.icon_url || null };

      const id = this.editingId();
      const obs = id
        ? this.linkService.updateLink(id, dto)
        : this.linkService.createLink(dto);

      try {
        await firstValueFrom(obs);
        this.toast.success(id ? 'Link diperbarui!' : 'Link ditambahkan!');
        this.cancelForm();
      } catch {
        // HTTP errors are handled by interceptors
      } finally {
        this.saving.set(false);
      }
    });
  }

  toggleLink(link: Link) {
    this.linkService.toggleActive(link.id).subscribe({
      next: () => this.toast.success(`Link ${link.is_active ? 'dinonaktifkan' : 'diaktifkan'}`),
    });
  }

  deleteLink(id: string) {
    if (!confirm('Hapus link ini?')) return;
    this.linkService.deleteLink(id).subscribe({
      next: () => this.toast.success('Link dihapus'),
    });
  }
}
