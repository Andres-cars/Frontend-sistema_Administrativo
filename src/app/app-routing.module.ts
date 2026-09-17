// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ListaDocentesComponent } from './features/docentes/lista-docentes/lista-docentes.component';
import { FormDocenteComponent } from './features/docentes/form-docente/form-docente.component';
import { ListaCursosComponent } from './features/cursos/lista-cursos/lista-cursos.component'; // ✅ NUEVO
import { FormCursoComponent } from './features/cursos/form-curso/form-curso.component';
import { ListaAsignaturasComponent } from './features/asignaturas/lista-asignaturas/lista-asignaturas.component';
import { FormAsignaturaComponent } from './features/asignaturas/form-asignatura/form-asignatura.component';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'docentes',
    component: ListaDocentesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR'] }
  },
  {
    path: 'docentes/crear',
    component: FormDocenteComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR'] }
  },
  {
    path: 'docentes/editar/:id',
    component: FormDocenteComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR'] }
  },// CURSOS ✅ NUEVO
  {
    path: 'cursos',
    component: ListaCursosComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR'] }
  },
  {
    path: 'cursos/crear',
    component: FormCursoComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR'] }
  },
  {
    path: 'cursos/editar/:id',
    component: FormCursoComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR'] }
  },
   // ASIGNATURAS ✅ NUEVO
  {
    path: 'asignaturas',
    component: ListaAsignaturasComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR'] }
  },
  {
    path: 'asignaturas/crear',
    component: FormAsignaturaComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR'] }
  },
  {
    path: 'asignaturas/editar/:id',
    component: FormAsignaturaComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR'] }
  },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }