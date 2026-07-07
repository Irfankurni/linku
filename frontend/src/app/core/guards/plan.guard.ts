import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { ToastService } from '../services/toast.service';

/** Gate for PRO-only features. Redirects to /dashboard/settings if on free plan. */
export const planGuard = (requiredPlan: 'pro' | 'business' = 'pro'): CanActivateFn => {
  return () => {
    const auth   = inject(AuthService);
    const toast  = inject(ToastService);
    const router = inject(Router);

    const currentPlan = auth.plan();
    const planOrder   = { free: 0, pro: 1, business: 2 } as const;

    if (planOrder[currentPlan] >= planOrder[requiredPlan]) return true;

    toast.warning(`Fitur ini memerlukan plan ${requiredPlan.toUpperCase()}. Silakan upgrade.`);
    return router.createUrlTree(['/dashboard/settings'], { queryParams: { tab: 'plan' } });
  };
};
