import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div
      class="animate-pulse rounded-xl bg-white/5"
      [style.height]="height()"
      [style.width]="width()"
    ></div>
  `,
})
export class SkeletonComponent {
  height = input('1.5rem');
  width  = input('100%');
}

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div class="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3 animate-pulse">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-full bg-white/10"></div>
        <div class="flex-1 space-y-2">
          <app-skeleton height="0.875rem" width="60%" />
          <app-skeleton height="0.75rem" width="40%" />
        </div>
      </div>
      <app-skeleton height="0.875rem" />
      <app-skeleton height="0.875rem" width="75%" />
    </div>
  `,
})
export class SkeletonCardComponent {}
