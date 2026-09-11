// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔍 AuthGuard - Verificando autenticación...');

  if (authService.isAuthenticated()) {
    console.log('✅ AuthGuard - Usuario autenticado');
    return true;
  }

  console.log('❌ AuthGuard - Usuario NO autenticado');
  router.navigate(['/login']);
  return false;
};