// src/app/features/cargas-horarias/lista-cargas/lista-cargas.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CargaHorariaService } from '../../../core/services/carga-horaria.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component'; // ✅ NUEVO

@Component({
  selector: 'app-lista-cargas',
  templateUrl: './lista-cargas.component.html',
  styleUrls: ['./lista-cargas.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, ConfirmDialogComponent] // ✅ NUEVO
})
export class ListaCargasComponent implements OnInit, OnDestroy {

  cargas: any[] = [];
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
    private cargaService: CargaHorariaService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();

    // Si venimos de guardar, mostrar aviso
    const state = this.router.getCurrentNavigation()?.extras?.state;
    if (state?.['successMessage']) {
      this.mostrarToast(state['successTitle'] || '¡Éxito!', state['successMessage']);
    }

    this.cargarCargas();
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

    this.cargarCargas();
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

  cargarCargas(): void {
    this.loading = true;
    this.errorMessage = '';

    this.cargaService.getAll().subscribe({
      next: (response) => {
        this.cargas = (response.data || []).sort((a: any, b: any) => a.id - b.id);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar cargas horarias';
        console.error('❌ Error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  irACrear(): void {
    this.router.navigate(['/cargas-horarias/crear']);
  }

  irAEditar(id: number): void {
    this.router.navigate([`/cargas-horarias/editar/${id}`]);
  }

  // ===== ✅ NUEVO: ELIMINAR CON CONFIRMACIÓN =====

  // 1. Al presionar 🗑️: abre el diálogo
  pedirEliminar(carga: any): void {
    const docente = `${carga.docente?.nombres || ''} ${carga.docente?.apellidos || ''}`.trim();
    const curso = `${carga.curso?.grado || ''} ${carga.curso?.paralelo || ''}`.trim();

    this.eliminando = {
      id: carga.id,
      nombre: `${carga.asignatura?.nombre || 'Carga'} · ${curso} · ${docente}`
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

    this.cargaService.delete(this.eliminando.id).subscribe({
      next: () => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.mostrarToast('Carga horaria eliminada', 'El registro se eliminó correctamente.');
        this.cargarCargas();
      },
      error: (error) => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.errorMessage = error.error?.message || 'Error al eliminar carga horaria';
        console.error('❌ Error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Buscador por docente, asignatura o curso
  cargasFiltradas(): any[] {
    if (!this.filtroBusqueda) return this.cargas;
    const q = this.filtroBusqueda.toLowerCase().trim();
    return this.cargas.filter(c => {
      const docente = `${c.docente?.nombres || ''} ${c.docente?.apellidos || ''}`.toLowerCase();
      const asignatura = (c.asignatura?.nombre || '').toLowerCase();
      const curso = `${c.curso?.nivel || ''} ${c.curso?.grado || ''} ${c.curso?.paralelo || ''}`.toLowerCase();
      return docente.includes(q) || asignatura.includes(q) || curso.includes(q);
    });
  }

  limpiarFiltro(): void {
    this.filtroBusqueda = '';
  }
}