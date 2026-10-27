// src/app/features/cursos/lista-cursos/lista-cursos.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { CursoService } from '../../../core/services/curso.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component'; // ✅ NUEVO

@Component({
  selector: 'app-lista-cursos',
  templateUrl: './lista-cursos.component.html',
  styleUrls: ['./lista-cursos.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, ConfirmDialogComponent] // ✅ NUEVO
})
export class ListaCursosComponent implements OnInit, OnDestroy {

  cursos: any[] = [];
  loading: boolean = false;
  errorMessage: string = '';

  // Toast flotante
  successTitle: string = '';
  successMessage: string = '';
  private toastTimer: any;

  isAdmin: boolean = false;
  filtroBusqueda: string = '';

  // ✅ NUEVO: confirmación de eliminar
  eliminando: { id: number; nombre: string } | null = null;
  eliminandoCargando = false;

  constructor(
    private cursoService: CursoService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();

    // Si viene del buscador del dashboard, llenar el filtro
    this.filtroBusqueda = this.route.snapshot.queryParamMap.get('buscar') || '';

    // Si venimos de guardar un curso, mostrar aviso
    const state = this.router.getCurrentNavigation()?.extras?.state;
    if (state?.['successMessage']) {
      this.mostrarToast(state['successTitle'] || '¡Éxito!', state['successMessage']);
    }

    this.cargarCursos();
  }

  ngOnDestroy(): void {
    clearTimeout(this.toastTimer);
  }

  // Se ejecuta cuando el modal se cierra (al guardar o cancelar)
  alCerrarFormulario(): void {
    const state = this.router.getCurrentNavigation()?.extras?.state;

    if (state?.['successMessage']) {
      this.mostrarToast(state['successTitle'] || '¡Éxito!', state['successMessage']);
    }

    this.cargarCursos();
  }

  // Muestra la notificación flotante 4 segundos
  mostrarToast(titulo: string, mensaje: string): void {
    this.successTitle = titulo;
    this.successMessage = mensaje;
    this.cdr.detectChanges();

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  cerrarToast(): void {
    clearTimeout(this.toastTimer);
    this.successMessage = '';
  }

  cargarCursos(): void {
    this.loading = true;
    this.errorMessage = '';

    this.cursoService.getAll().subscribe({
      next: (response) => {
        this.cursos = (response.data || []).sort((a: any, b: any) => a.id - b.id);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar cursos';
        console.error('❌ Error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  irACrear(): void {
    this.router.navigate(['/cursos/crear']);
  }

  irAEditar(id: number): void {
    this.router.navigate([`/cursos/editar/${id}`]);
  }

  // ===== ✅ NUEVO: ELIMINAR CON CONFIRMACIÓN =====

  // 1. Al presionar 🗑️: abre el diálogo
  pedirEliminar(curso: any): void {
    this.eliminando = {
      id: curso.id,
      nombre: `${curso.grado} ${curso.paralelo} – ${curso.nivel}`
    };
  }

  // 2. Al presionar Cancelar, Esc o clic afuera: cierra el diálogo
  cancelarEliminar(): void {
    this.eliminando = null;
  }

  // 3. Al presionar "Sí, eliminar": elimina de verdad
  confirmarEliminar(): void {
    if (!this.eliminando) return;
    this.eliminandoCargando = true;

    this.cursoService.delete(this.eliminando.id).subscribe({
      next: () => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.mostrarToast('Curso eliminado', 'El registro se eliminó correctamente.');
        this.cargarCursos();
      },
      error: (error) => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.errorMessage = error.error?.message || 'Error al eliminar curso';
        console.error('❌ Error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Nombre del aula para mostrar en la tabla
  nombreAula(curso: any): string {
    if (curso.aula?.nombre) return curso.aula.nombre;
    if (curso.aula_id) return `Aula #${curso.aula_id}`;
    return '';
  }

  cursosFiltrados(): any[] {
    if (!this.filtroBusqueda) return this.cursos;
    const q = this.filtroBusqueda.toLowerCase().trim();
    return this.cursos.filter(c => {
      const nombreCompleto = `${c.nivel} ${c.grado} "${c.paralelo}"`.toLowerCase();
      return (
        (c.nivel || '').toLowerCase().includes(q) ||
        (c.grado || '').toLowerCase().includes(q) ||
        (c.paralelo || '').toLowerCase().includes(q) ||
        this.nombreAula(c).toLowerCase().includes(q) ||
        nombreCompleto.includes(q)
      );
    });
  }

  limpiarFiltro(): void {
    this.filtroBusqueda = '';
  }
}