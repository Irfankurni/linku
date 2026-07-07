import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from './translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Allows the pipe to update when the signal changes without relying on input change
})
export class TranslatePipe implements PipeTransform {
  private ts = inject(TranslationService);

  transform(key: string, params?: Record<string, string>): string {
    return this.ts.t()(key, params);
  }
}
