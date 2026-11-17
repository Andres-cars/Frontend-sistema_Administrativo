// src/app/features/horarios/generar-horario/generar-horario.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { timeout } from 'rxjs';

import { HorarioService } from '../../../core/services/horario.service';
import { CursoService } from '../../../core/services/curso.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';// ✅ NUEVO

@Component({
  selector: 'app-generar-horario',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './generar-horario.component.html',
  styleUrls: ['./generar-horario.component.css']
})
export class GenerarHorarioComponent implements OnInit {
  // Parámetros
  periodoId: number = 1;
  jornadaId: number = 1;
  cursoId: number | null = null;
  nombreHorario: string = '';

  cursos: any[] = [];

  // Estado
  generando: boolean = false;
  guardando: boolean = false;
  resultado: any = null;
  errorMessage: string = '';
  successMessage: string = '';
  faltanCargas: boolean = false;

  horariosGuardados: any[] = [];
  cargandoHorarios: boolean = false;

  completo: boolean = false;
  clasesFaltantes: number = 0;
  horasRequeridas: number = 0;

  // ✅ NUEVO: confirmación de eliminar
  eliminando: { id: number; nombre: string } | null = null;
  eliminandoCargando = false;

  constructor(
    private horarioService: HorarioService,
    private cursoService: CursoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCursos();
    this.cargarHorariosGuardados();
  }

  // ============================================
  // CARGAR CURSOS
  // ============================================
  cargarCursos(): void {
    this.cursoService.getAll().subscribe({
      next: (response: any) => {
        this.cursos = (response.data || []).sort((a: any, b: any) => a.id - b.id);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar cursos:', error);
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================
  // AL CAMBIAR DE CURSO
  // ============================================
  onCursoChange(): void {
    this.errorMessage = '';
    this.faltanCargas = false;
    if (this.cursoId) {
      const curso = this.cursos.find(c => c.id === Number(this.cursoId));
      if (curso) {
        this.nombreHorario = `Horario ${curso.grado} "${curso.paralelo}"`;
      }
    } else {
      this.nombreHorario = '';
    }
  }

  // ============================================
  // GENERAR HORARIO
  // ============================================
  generarHorario(): void {
    if (this.generando) return;

    if (!this.cursoId) {
      this.errorMessage = 'Debe seleccionar un curso primero';
      return;
    }

    this.generando = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.faltanCargas = false;
    this.resultado = null;

    const startTime = Date.now();

    this.horarioService
      .generar(this.periodoId, this.jornadaId, this.cursoId)
      .pipe(timeout(60000))
      .subscribe({
        next: (response) => {
          const tiempoTranscurrido = Date.now() - startTime;
          const tiempoEspera = Math.max(0, 2000 - tiempoTranscurrido);

          setTimeout(() => {
            this.generando = false;

            if (!response?.data) {
              this.mostrarErrorGenerar({ error: { message: response?.message } });
              return;
            }

            this.resultado = response.data;
            this.completo = this.resultado.completo;
            this.clasesFaltantes = this.resultado.clasesFaltantes || 0;
            this.horasRequeridas = this.resultado.horasRequeridas || 0;

            if (this.completo) {
              this.successMessage = `Horario generado correctamente (${this.resultado.fitness}% aptitud, ${this.resultado.totalClases} clases)`;
            } else {
              this.successMessage = `Horario generado, pero FALTAN ${this.clasesFaltantes} clases (${this.resultado.fitness}%)`;
            }
            this.cdr.detectChanges();
          }, tiempoEspera);
        },
        error: (error) => {
          const espera = Math.max(0, 2000 - (Date.now() - startTime));
          setTimeout(() => this.mostrarErrorGenerar(error), espera);
        }
      });
  }

  private mostrarErrorGenerar(error: any): void {
    this.generando = false;
    this.resultado = null;
    this.successMessage = '';

    const msgBackend: string = error?.error?.message || '';

    if (error?.name === 'TimeoutError') {
      this.errorMessage = 'El servidor tardó demasiado en responder. Inténtalo de nuevo.';
    } else if (error?.status === 0) {
      this.errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.';
    } else if (/carga/i.test(msgBackend)) {
      this.faltanCargas = true;
      this.errorMessage =
        'Este curso no tiene cargas horarias registradas. ' +
        'Asigna primero las asignaturas y docentes del curso en "Cargas horarias".';
    } else if (msgBackend) {
      this.errorMessage = msgBackend;
    } else if (error?.status >= 500) {
      this.errorMessage = 'Ocurrió un problema en el servidor. Inténtalo más tarde.';
    } else {
      this.errorMessage = 'Error al generar horario';
    }

    console.error('❌ Error al generar horario:', error);
    this.cdr.detectChanges();
  }

  irACargas(): void {
    this.router.navigate(['/cargas-horarias']);
  }

  // ============================================
  // GUARDAR HORARIO
  // ============================================
  guardarHorario(): void {
    if (!this.resultado || this.guardando) return;

    if (!this.nombreHorario || this.nombreHorario.trim() === '') {
      this.errorMessage = 'Debe ingresar un nombre para el horario';
      return;
    }

    this.guardando = true;
    this.errorMessage = '';

    const data = {
      periodoId: this.periodoId,
      jornadaId: this.jornadaId,
      nombre: this.nombreHorario,
      clases: this.resultado.clases
    };

    this.horarioService.guardar(data).subscribe({
      next: () => {
        this.guardando = false;
        this.successMessage = 'Horario guardado correctamente';
        this.cargarHorariosGuardados();
        this.resultado = null;
        this.cursoId = null;
        this.nombreHorario = '';
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.guardando = false;
        this.errorMessage = error.error?.message || 'Error al guardar horario';
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================
  // HORARIOS GUARDADOS
  // ============================================
  cargarHorariosGuardados(): void {
    this.cargandoHorarios = true;
    this.horarioService.getAll().subscribe({
      next: (response) => {
        this.horariosGuardados = response.data || [];
        this.cargandoHorarios = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.cargandoHorarios = false;
        console.error('❌ Error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  verHorario(id: number): void {
    this.router.navigate([`/horarios/ver/${id}`]);
  }

  // ===== ✅ ELIMINAR CON CONFIRMACIÓN =====
  pedirEliminar(h: any): void {
    this.eliminando = { id: h.id, nombre: h.nombre };
  }

  cancelarEliminar(): void {
    this.eliminando = null;
  }

  confirmarEliminar(): void {
    if (!this.eliminando) return;
    this.eliminandoCargando = true;

    this.horarioService.delete(this.eliminando.id).subscribe({
      next: () => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.errorMessage = '';
        this.successMessage = 'Horario eliminado correctamente';
        this.cargarHorariosGuardados();
      },
      error: (error) => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.errorMessage = error.error?.message || 'Error al eliminar horario';
        this.cdr.detectChanges();
      }
    });
  }

  getFitnessClass(): string {
    if (!this.resultado) return '';
    const f = this.resultado.fitness;
    if (f >= 95) return 'fitness-excelente';
    if (f >= 80) return 'fitness-bueno';
    if (f >= 60) return 'fitness-regular';
    return 'fitness-malo';
  }

  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}