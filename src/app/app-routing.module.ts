// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ListaDocentesComponent } from './features/docentes/lista-docentes/lista-docentes.component';
import { FormDocenteComponent } from './features/docentes/form-docente/form-docente.component';
import { ListaCursosComponent } from './features/cursos/lista-cursos/lista-cursos.component';
import { FormCursoComponent } from './features/cursos/form-curso/form-curso.component';
import { ListaAsignaturasComponent } from './features/asignaturas/lista-asignaturas/lista-asignaturas.component';
import { FormAsignaturaComponent } from './features/asignaturas/form-asignatura/form-asignatura.component';
import { ListaAulasComponent } from './features/aulas/lista-aulas/lista-aulas.component';
import { FormAulaComponent } from './features/aulas/form-aula/form-aula.component';
import { ListaCargasComponent } from './features/cargas-horarias/lista-cargas/lista-cargas.component';
import { FormCargaComponent } from './features/cargas-horarias/form-carga/form-carga.component';
import { GenerarHorarioComponent } from './features/horarios/generar-horario/generar-horario.component';
import { VerHorarioComponent } from './features/horarios/ver-horario/ver-horario.component';
import { ListaAdminsComponent } from './features/admins/lista-admins/lista-admins.component';
import { FormAdminComponent } from './features/admins/form-admin/form-admin.component';
import { LayoutComponent } from './layout/layout.component'; // ✅ LAYOUT
import { MiHorarioComponent } from './features/mi-horario/mi-horario.component';
import { ReporteCargaComponent } from './features/reportes/reporte-carga/reporte-carga.component'; // ✅ REPORTES
import { HistorialCambiosComponent } from './features/historial/historial-cambios/historial-cambios.component'; // ✅ HISTORIAL

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

const soloAdmin = {
  canActivate: [authGuard, roleGuard],
  data: { roles: ['ADMINISTRADOR'] }
};

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // ✅ LAYOUT: todo lo que va con menú lateral
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard]
      },
      {
        path: 'mi-horario',
        component: MiHorarioComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['DOCENTE'] }
      },
      // ✅ El admin ve el horario de un docente
      {
        path: 'horario-docente/:id',
        component: MiHorarioComponent,
        ...soloAdmin
      },
      {
        path: 'docentes',
        component: ListaDocentesComponent,
        ...soloAdmin,
        children: [
          { path: 'crear', component: FormDocenteComponent },
          { path: 'editar/:id', component: FormDocenteComponent }
        ]
      },
      {
        path: 'cursos',
        component: ListaCursosComponent,
        ...soloAdmin,
        children: [
          { path: 'crear', component: FormCursoComponent },
          { path: 'editar/:id', component: FormCursoComponent }
        ]
      },
      {
        path: 'asignaturas',
        component: ListaAsignaturasComponent,
        ...soloAdmin,
        children: [
          { path: 'crear', component: FormAsignaturaComponent },
          { path: 'editar/:id', component: FormAsignaturaComponent }
        ]
      },
      {
        path: 'aulas',
        component: ListaAulasComponent,
        ...soloAdmin,
        children: [
          { path: 'crear', component: FormAulaComponent },
          { path: 'editar/:id', component: FormAulaComponent }
        ]
      },
      {
        path: 'cargas-horarias',
        component: ListaCargasComponent,
        ...soloAdmin,
        children: [
          { path: 'crear', component: FormCargaComponent },
          { path: 'editar/:id', component: FormCargaComponent }
        ]
      },
      // ✅ Reporte de carga por docente (solo admin)
      { path: 'reportes', component: ReporteCargaComponent, ...soloAdmin },
            // ✅ RN-12: Historial de cambios (solo admin)
      { path: 'historial', component: HistorialCambiosComponent, ...soloAdmin },
      { path: 'horarios', component: GenerarHorarioComponent, ...soloAdmin },
      { path: 'horarios/ver/:id', component: VerHorarioComponent, ...soloAdmin },
      {
        path: 'admins',
        component: ListaAdminsComponent,
        ...soloAdmin,
        children: [
          { path: 'crear', component: FormAdminComponent },
          { path: 'editar/:id', component: FormAdminComponent }
        ]
      }
    ]
  },

  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }