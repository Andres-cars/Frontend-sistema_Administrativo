// src/app/features/asignaturas/lista-asignaturas/lista-asignaturas.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AsignaturaService } from '../../../core/services/asignatura.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component'; // ✅ NUEVO

@Component({
  selector: 'app-lista-asignaturas',
  templateUrl: './lista-asignaturas.component.html',
  styleUrls: ['./lista-asignaturas.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterOutlet, ConfirmDialogComponent] // ✅ NUEVO
})
export class ListaAsignaturasComponent implements OnInit, OnDestroy {

  asignaturas: any[] = [];
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
    private asignaturaService: AsignaturaService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();

    // Si viene del buscador del dashboard, llenar el filtro
    this.filtroBusqueda = this.route.snapshot.queryParamMap.get('buscar') || '';

    // Si venimos de guardar, mostrar aviso
    const state = this.router.getCurrentNavigation()?.extras?.state;
    if (state?.['successMessage']) {
      this.mostrarToast(state['successTitle'] || '¡Éxito!', state['successMessage']);
    }

    this.cargarAsignaturas();
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

    this.cargarAsignaturas();
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

  cargarAsignaturas(): void {
    this.loading = true;
    this.errorMessage = '';

    this.asignaturaService.getAll().subscribe({
      next: (response) => {
        this.asignaturas = (response.data || []).sort((a: any, b: any) => a.id - b.id);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar asignaturas';
        console.error('❌ Error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  irACrear(): void {
    this.router.navigate(['/asignaturas/crear']);
  }

  irAEditar(id: number): void {
    this.router.navigate([`/asignaturas/editar/${id}`]);
  }

  // ===== ✅ NUEVO: ELIMINAR CON CONFIRMACIÓN =====

  // 1. Al presionar 🗑️: abre el diálogo
  pedirEliminar(asignatura: any): void {
    this.eliminando = {
      id: asignatura.id,
      nombre: asignatura.codigo
        ? `${asignatura.nombre} (${asignatura.codigo})`
        : asignatura.nombre
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

    this.asignaturaService.delete(this.eliminando.id).subscribe({
      next: () => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.mostrarToast('Asignatura eliminada', 'El registro se eliminó correctamente.');
        this.cargarAsignaturas();
      },
      error: (error) => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.errorMessage = error.error?.message || 'Error al eliminar asignatura';
        console.error('❌ Error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  asignaturasFiltradas(): any[] {
    if (!this.filtroBusqueda) return this.asignaturas;
    const q = this.filtroBusqueda.toLowerCase().trim();
    return this.asignaturas.filter(a =>
      (a.nombre || '').toLowerCase().includes(q) ||
      (a.codigo || '').toLowerCase().includes(q)
    );
  }

  limpiarFiltro(): void {
    this.filtroBusqueda = '';
  }
}