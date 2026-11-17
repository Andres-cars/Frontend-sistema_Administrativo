// src/app/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data?.['roles'] as string[] || [];
  const user = authService.getUsuario();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (allowedRoles.length === 0 || allowedRoles.includes(user.rol)) {
    return true;
  }

  // ❌ Acceso denegado: cada rol vuelve a su pantalla de inicio
  if (user.rol === 'DOCENTE') {
    router.navigate(['/mi-horario'], {
      state: { avisoAcceso: 'Esa sección es solo para administradores. Te trajimos a tu horario.' }
    });
  } else {
    router.navigate(['/dashboard']);
  }
  return false;
};