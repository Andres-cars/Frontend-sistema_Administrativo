// src/app/features/horarios/ver-horario/ver-horario.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HorarioService } from '../../../core/services/horario.service';

@Component({
  selector: 'app-ver-horario',
  templateUrl: './ver-horario.component.html',
  styleUrls: ['./ver-horario.component.css']
})
export class VerHorarioComponent implements OnInit {
  horario: any = null;
  loading: boolean = true;
  errorMessage: string = '';

  // Estructura del calendario
  dias: string[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];
  horas: string[] = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00'];
  grid: any = {};
  successMessage: string = '';

  constructor(
    private horarioService: HorarioService,
    private route: ActivatedRoute,
    private router: Router, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.cargarHorario(id);
    }
  }

  cargarHorario(id: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.horarioService.getById(id).subscribe({
      next: (response) => {
        this.horario = response.data;
        this.construirGrid();
        this.loading = false;
         this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al cargar horario';
        this.loading = false;
      }
    });
  }

  /**
   * Construye el grid del calendario
   * grid[dia][hora] = clase
   */
  construirGrid(): void {
    this.grid = {};

    // Inicializar grid vacío
    for (const dia of this.dias) {
      this.grid[dia] = {};
      for (const hora of this.horas) {
        this.grid[dia][hora] = null;
      }
    }

    // Llenar con las clases del horario
    if (this.horario?.detalles) {
      for (const detalle of this.horario.detalles) {
        const dia = detalle.dia_semana;
        const hora = detalle.hora_inicio.substring(0, 5); // '07:00'

        if (this.grid[dia] && this.grid[dia][hora] !== undefined) {
          this.grid[dia][hora] = detalle;
        }
      }
    }
  }

  getClase(dia: string, hora: string): any {
    return this.grid[dia]?.[hora] || null;
  }

  volver(): void {
    this.router.navigate(['/horarios']);
  }

  imprimir(): void {
    window.print();
  }
  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}