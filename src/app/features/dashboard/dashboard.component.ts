// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../core/services/auth.service';
import { DocenteService } from '../../core/services/docente.service';
import { CursoService } from '../../core/services/curso.service';
import { AsignaturaService } from '../../core/services/asignatura.service';
import { AulaService } from '../../core/services/aula.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit {

  usuario: any = null;

  // Métricas
  totalDocentes: number | null = null;
  totalCursos: number | null = null;
  totalAsignaturas: number | null = null;
  totalAulas: number | null = null;

  // Estado de carga
  cargandoDocentes = true;
  cargandoCursos = true;
  cargandoAsignaturas = true;
  cargandoAulas = true;

  constructor(
    private authService: AuthService,
    private docenteService: DocenteService,
    private cursoService: CursoService,
    private asignaturaService: AsignaturaService,
    private aulaService: AulaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    console.log('📊 Dashboard - Usuario:', this.usuario);

    this.cargarTotalDocentes();
    this.cargarTotalCursos();
    this.cargarTotalAsignaturas();
    this.cargarTotalAulas();
  }

  // ============================
  // CARGAR MÉTRICAS
  // ============================

  cargarTotalDocentes(): void {
    this.cargandoDocentes = true;
    this.docenteService.getAll().subscribe({
      next: (response: any) => {
        this.totalDocentes = response?.data?.length || 0;
        this.cargandoDocentes = false;
        console.log('👨‍🏫 Total docentes:', this.totalDocentes);
      },
      error: (error) => {
        console.error('❌ Error docentes:', error);
        this.totalDocentes = 0;
        this.cargandoDocentes = false;
      }
    });
  }

  cargarTotalCursos(): void {
    this.cargandoCursos = true;
    this.cursoService.getAll().subscribe({
      next: (response: any) => {
        this.totalCursos = response?.data?.length || 0;
        this.cargandoCursos = false;
        console.log('📚 Total cursos:', this.totalCursos);
      },
      error: (error) => {
        console.error('❌ Error cursos:', error);
        this.totalCursos = 0;
        this.cargandoCursos = false;
      }
    });
  }

  cargarTotalAsignaturas(): void {
    this.cargandoAsignaturas = true;
    this.asignaturaService.getAll().subscribe({
      next: (response: any) => {
        this.totalAsignaturas = response?.data?.length || 0;
        this.cargandoAsignaturas = false;
        console.log('📖 Total asignaturas:', this.totalAsignaturas);
      },
      error: (error) => {
        console.error('❌ Error asignaturas:', error);
        this.totalAsignaturas = 0;
        this.cargandoAsignaturas = false;
      }
    });
  }

  cargarTotalAulas(): void {
    this.cargandoAulas = true;
    this.aulaService.getAll().subscribe({
      next: (response: any) => {
        this.totalAulas = response?.data?.length || 0;
        this.cargandoAulas = false;
        console.log('🏫 Total aulas:', this.totalAulas);
      },
      error: (error) => {
        console.error('❌ Error aulas:', error);
        this.totalAulas = 0;
        this.cargandoAulas = false;
      }
    });
  }

  // ============================
  // NAVEGACIÓN
  // ============================

  irADocentes(): void { this.router.navigate(['/docentes']); }
  irACursos(): void { this.router.navigate(['/cursos']); }
  irAAsignaturas(): void { this.router.navigate(['/asignaturas']); }
  irAAulas(): void { this.router.navigate(['/aulas']); }
  irAHorarios(): void { this.router.navigate(['/horarios']); }
  // Agregar en la clase DashboardComponent:
irACargas(): void { this.router.navigate(['/cargas-horarias']); }

  logout(): void {
    this.authService.logout();
  }
}