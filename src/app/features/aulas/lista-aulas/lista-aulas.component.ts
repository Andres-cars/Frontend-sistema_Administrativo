// src/app/features/aulas/lista-aulas/lista-aulas.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AulaService } from '../../../core/services/aula.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component'; // ✅ NUEVO

@Component({
  selector: 'app-lista-aulas',
  templateUrl: './lista-aulas.component.html',
  styleUrls: ['./lista-aulas.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterOutlet, ConfirmDialogComponent] // ✅ NUEVO
})
export class ListaAulasComponent implements OnInit, OnDestroy {

  aulas: any[] = [];
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
    private aulaService: AulaService,
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

    this.cargarAulas();
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

    this.cargarAulas();
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

  cargarAulas(): void {
    this.loading = true;
    this.errorMessage = '';

    this.aulaService.getAll().subscribe({
      next: (response) => {
        this.aulas = (response.data || []).sort((a: any, b: any) => a.id - b.id);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar aulas';
        console.error('❌ Error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  irACrear(): void {
    this.router.navigate(['/aulas/crear']);
  }

  irAEditar(id: number): void {
    this.router.navigate([`/aulas/editar/${id}`]);
  }

  // ===== ✅ NUEVO: ELIMINAR CON CONFIRMACIÓN =====

  // 1. Al presionar 🗑️: abre el diálogo
  pedirEliminar(aula: any): void {
    this.eliminando = {
      id: aula.id,
      nombre: aula.tipo ? `${aula.nombre} (${aula.tipo})` : aula.nombre
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

    this.aulaService.delete(this.eliminando.id).subscribe({
      next: () => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.mostrarToast('Aula eliminada', 'El registro se eliminó correctamente.');
        this.cargarAulas();
      },
      error: (error) => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.errorMessage = error.error?.message || 'Error al eliminar aula';
        console.error('❌ Error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  aulasFiltradas(): any[] {
    if (!this.filtroBusqueda) return this.aulas;
    const q = this.filtroBusqueda.toLowerCase().trim();
    return this.aulas.filter(a =>
      (a.nombre || '').toLowerCase().includes(q) ||
      (a.tipo || '').toLowerCase().includes(q) ||
      (a.capacidad?.toString() || '').includes(q)
    );
  }

  limpiarFiltro(): void {
    this.filtroBusqueda = '';
  }
}