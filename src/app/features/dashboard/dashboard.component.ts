// src/app/features/dashboard/dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../core/services/auth.service';
import { DocenteService } from '../../core/services/docente.service';

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
  totalHorarios: number | null = null;

  // Estado de carga
  cargandoDocentes = true;

  constructor(
    private authService: AuthService,
    private docenteService: DocenteService,
    private router: Router
  ) {}

  ngOnInit(): void {

    // Obtener usuario actual
    this.usuario = this.authService.getUsuario();

    console.log('📊 Dashboard - Usuario:', this.usuario);

    // Cargar cantidad de docentes
    this.cargarTotalDocentes();
  }

  cargarTotalDocentes(): void {

    this.cargandoDocentes = true;

    console.log('📡 Consultando docentes...');

    this.docenteService.getAll().subscribe({

      next: (response: any) => {

        console.log('✅ Respuesta docentes:', response);

        // Tu API devuelve:
        // {
        //   success: true,
        //   data: [...]
        //   total: 8
        // }

        if (response && response.data) {

          this.totalDocentes = response.data.length;

        } else if (Array.isArray(response)) {

          // Por si algún día el backend devuelve directamente el array
          this.totalDocentes = response.length;

        } else {

          this.totalDocentes = 0;
        }

        this.cargandoDocentes = false;

        console.log(
          '👨‍🏫 Total docentes:',
          this.totalDocentes
        );
      },

      error: (error) => {

        console.error(
          '❌ Error cargando docentes:',
          error
        );

        this.totalDocentes = null;

        this.cargandoDocentes = false;
      },

      complete: () => {

        // Seguridad: nunca dejar el estado de carga activo
        this.cargandoDocentes = false;

      }

    });
  }

  // ============================
  // NAVEGACIÓN
  // ============================

  irADocentes(): void {
    this.router.navigate(['/docentes']);
  }

  irACursos(): void {
    this.router.navigate(['/cursos']);
  }

  irAAsignaturas(): void {
    this.router.navigate(['/asignaturas']);
  }

  logout(): void {
    this.authService.logout();
  }

}