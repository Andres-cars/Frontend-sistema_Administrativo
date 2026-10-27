// src/app/features/docentes/lista-docentes/lista-docentes.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { DocenteService } from '../../../core/services/docente.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
// ✅ NUEVO

@Component({
  selector: 'app-lista-docentes',
  templateUrl: './lista-docentes.component.html',
  styleUrls: ['./lista-docentes.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterOutlet, ConfirmDialogComponent] // ✅ NUEVO
})
export class ListaDocentesComponent implements OnInit, OnDestroy {

  docentes: any[] = [];
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
    private docenteService: DocenteService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();

    // Si viene del buscador del dashboard, llenar el filtro
    this.filtroBusqueda = this.route.snapshot.queryParamMap.get('buscar') || '';

    // Si venimos de guardar un docente, mostrar aviso
    const state = this.router.getCurrentNavigation()?.extras?.state;
    if (state?.['successMessage']) {
      this.mostrarToast(state['successTitle'] || '¡Éxito!', state['successMessage']);
    }

    this.cargarDocentes();
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

    this.cargarDocentes();
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

  cargarDocentes(): void {
    this.loading = true;
    this.errorMessage = '';

    this.docenteService.getAll().subscribe({
      next: (response) => {
        this.docentes = (response.data || []).sort((a: any, b: any) => a.id - b.id);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar docentes:', error);
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar docentes';
        this.cdr.detectChanges();
      }
    });
  }

  irACrear(): void {
    this.router.navigate(['/docentes/crear']);
  }

  irAEditar(id: number): void {
    this.router.navigate([`/docentes/editar/${id}`]);
  }

  // ===== ✅ NUEVO: ELIMINAR CON CONFIRMACIÓN =====

  // 1. Al presionar 🗑️: abre el diálogo
  pedirEliminar(docente: any): void {
    this.eliminando = {
      id: docente.id,
      nombre: `${docente.nombres} ${docente.apellidos}`
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

    this.docenteService.delete(this.eliminando.id).subscribe({
      next: () => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.mostrarToast('Docente eliminado', 'El registro se eliminó correctamente.');
        this.cargarDocentes();
      },
      error: (error) => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.errorMessage = error.error?.message || 'Error al eliminar docente';
        console.error('❌ Error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  docentesFiltrados(): any[] {
    if (!this.filtroBusqueda) return this.docentes;
    const q = this.filtroBusqueda.toLowerCase().trim();
    return this.docentes.filter(d =>
      (d.nombres || '').toLowerCase().includes(q) ||
      (d.apellidos || '').toLowerCase().includes(q) ||
      (d.identificacion || '').toLowerCase().includes(q)
    );
  }

  limpiarFiltro(): void {
    this.filtroBusqueda = '';
  }
}