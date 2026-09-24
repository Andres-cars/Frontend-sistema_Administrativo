// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { App } from './app.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ListaDocentesComponent } from './features/docentes/lista-docentes/lista-docentes.component';
import { FormDocenteComponent } from './features/docentes/form-docente/form-docente.component';

import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ListaCursosComponent } from './features/cursos/lista-cursos/lista-cursos.component';
import { FormCursoComponent } from './features/cursos/form-curso/form-curso.component';
import { ListaAsignaturasComponent } from './features/asignaturas/lista-asignaturas/lista-asignaturas.component';
import { FormAsignaturaComponent } from './features/asignaturas/form-asignatura/form-asignatura.component';
import { ListaAulasComponent } from './features/aulas/lista-aulas/lista-aulas.component';
import { FormAulaComponent } from './features/aulas/form-aula/form-aula.component';
import { ListaCargasComponent } from './features/cargas-horarias/lista-cargas/lista-cargas.component';
import { FormCargaComponent } from './features/cargas-horarias/form-carga/form-carga.component';

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    LoginComponent,
    DashboardComponent,
    ListaDocentesComponent,
    FormDocenteComponent,
    ListaCursosComponent,
    FormCursoComponent,
    ListaAsignaturasComponent,
    FormAsignaturaComponent,
    ListaAulasComponent,
    FormAulaComponent,
    ListaCargasComponent,
    FormCargaComponent,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [App],
})
export class AppModule {}
