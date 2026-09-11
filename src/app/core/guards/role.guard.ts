// src/app/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data?.['roles'] as string[] || [];
  const user = authService.getUsuario();

  console.log('🔍 RoleGuard - Usuario:', user);
  console.log('🔍 RoleGuard - Roles permitidos:', allowedRoles);

  if (!user) {
    console.log('❌ RoleGuard - Usuario no encontrado');
    router.navigate(['/login']);
    return false;
  }

  if (allowedRoles.length === 0 || allowedRoles.includes(user.rol)) {
    console.log('✅ RoleGuard - Acceso permitido');
    return true;
  }

  console.log('❌ RoleGuard - Acceso denegado');
  router.navigate(['/dashboard']);
  return false;
};