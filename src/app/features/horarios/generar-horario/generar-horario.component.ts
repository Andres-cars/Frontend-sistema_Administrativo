// src/app/features/horarios/generar-horario/generar-horario.component.ts
import { Component, OnInit,ChangeDetectorRef} from '@angular/core';
import { Router } from '@angular/router';
import { HorarioService } from '../../../core/services/horario.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generar-horario',
   standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './generar-horario.component.html',
  styleUrls: ['./generar-horario.component.css']
})
export class GenerarHorarioComponent implements OnInit {
  // Parámetros
  periodoId: number = 1;
  jornadaId: number = 1;
  nombreHorario: string = 'Horario 2026-2027';

  // Estado
  generando: boolean = false;
  guardando: boolean = false;
  resultado: any = null;
  errorMessage: string = '';
  successMessage: string = '';

  // Horarios guardados
  horariosGuardados: any[] = [];
  cargandoHorarios: boolean = false;

  constructor(
    private horarioService: HorarioService,
    private router: Router,
      private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();

    if (navigation?.extras?.state?.['successMessage']) {

      this.successMessage =
        navigation.extras.state['successMessage'];

      setTimeout(() => {

        this.successMessage = '';

        this.cdr.detectChanges();

      }, 3500);}

    this.cargarHorariosGuardados();
    
  }

  // ============================================
  // GENERAR HORARIO
  // ============================================
  generarHorario(): void {
    if (this.generando) return;

    this.generando = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.resultado = null;

    console.log('🧬 Generando horario...');

    this.horarioService.generar(this.periodoId, this.jornadaId).subscribe({
      next: (response) => {
        this.generando = false;
        this.resultado = response.data;
        console.log('✅ Horario generado:', this.resultado);

        if (this.resultado.exito) {
          this.successMessage = `✅ Horario generado con éxito (${this.resultado.fitness}% de aptitud)`;
        } else {
          this.successMessage = `⚠️ Horario generado con ${this.resultado.conflictos} conflictos (${this.resultado.fitness}%)`;
        }this.cdr.detectChanges();
      },
      error: (error) => {
        this.generando = false;
        this.errorMessage = error.error?.message || 'Error al generar horario';
        console.error('❌ Error:', error);
      }
    });
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

    console.log('💾 Guardando horario...');

    this.horarioService.guardar(data).subscribe({
      next: (response) => {
        this.guardando = false;
        this.successMessage = '✅ Horario guardado correctamente';
        this.cargarHorariosGuardados();
      },
      error: (error) => {
        this.guardando = false;
        this.errorMessage = error.error?.message || 'Error al guardar horario';
        console.error('❌ Error:', error);
      }
    });
  }

  // ============================================
  // CARGAR HORARIOS GUARDADOS
  // ============================================
  cargarHorariosGuardados(): void {
    this.cargandoHorarios = true;
     this.errorMessage = '';
    this.horarioService.getAll().subscribe({
      next: (response) => {
        this.horariosGuardados = response.data || [];
        this.cargandoHorarios = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.cargandoHorarios = false;
        console.error('❌ Error:', error);
      }
    });
  }

  // ============================================
  // VER HORARIO
  // ============================================
  verHorario(id: number): void {
    this.router.navigate([`/horarios/ver/${id}`]);
  }

  // ============================================
  // ELIMINAR HORARIO
  // ============================================
  eliminarHorario(id: number): void {
    if (!confirm('¿Estás seguro de eliminar este horario?')) return;

    this.horarioService.delete(id).subscribe({
      next: () => {
        this.cargarHorariosGuardados();
      },
      error: (error) => {
        alert(error.error?.message || 'Error al eliminar horario');
      }
    });
  }

  // ============================================
  // UTILIDADES
  // ============================================
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