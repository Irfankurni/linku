import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div class="text-5xl mb-4">{{ icon() }}</div>
      <h3 class="text-lg font-semibold text-white mb-2">{{ title() }}</h3>
      <p class="text-sm text-slate-400 max-w-xs">{{ description() }}</p>
      <div class="mt-6">
        <ng-content />
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  icon        = input('📭');
  title       = input('Belum ada data');
  description = input('Mulai tambahkan item pertama Anda.');
}
