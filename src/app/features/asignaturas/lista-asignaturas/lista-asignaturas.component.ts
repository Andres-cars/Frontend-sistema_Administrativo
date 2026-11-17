// src/app/features/asignaturas/lista-asignaturas/lista-asignaturas.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AsignaturaService } from '../../../core/services/asignatura.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-lista-asignaturas',
  templateUrl: './lista-asignaturas.component.html',
  styleUrls: ['./lista-asignaturas.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterOutlet]
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

  // ✅ Filtro por estado y botón en proceso
  filtroEstado: 'todas' | 'activas' | 'inactivas' = 'todas';
  cambiandoId: number | null = null;

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

    // ✅ true = también las inactivas
    this.asignaturaService.getAll(true).subscribe({
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

  // ===== ✅ ACTIVAR / DESACTIVAR =====
  cambiarEstado(asignatura: any): void {
    if (this.cambiandoId) return;

    const nuevoEstado = !asignatura.estado;
    this.cambiandoId = asignatura.id;
    this.errorMessage = '';

    this.asignaturaService.cambiarEstado(asignatura.id, nuevoEstado).subscribe({
      next: () => {
        asignatura.estado = nuevoEstado; // se actualiza en la tabla sin recargar
        this.cambiandoId = null;
        this.mostrarToast(
          nuevoEstado ? 'Asignatura activada' : 'Asignatura desactivada',
          nuevoEstado
            ? `"${asignatura.nombre}" vuelve a estar disponible para las cargas horarias.`
            : `"${asignatura.nombre}" ya no se usará en nuevas cargas ni en los horarios.`
        );
      },
      error: (error) => {
        this.cambiandoId = null;
        this.errorMessage = error.error?.message || 'No se pudo cambiar el estado de la asignatura';
        this.cdr.detectChanges();
      }
    });
  }

  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // ✅ Contadores para el filtro
  get totalActivas(): number {
    return this.asignaturas.filter(a => a.estado).length;
  }

  get totalInactivas(): number {
    return this.asignaturas.filter(a => !a.estado).length;
  }

  asignaturasFiltradas(): any[] {
    let lista = this.asignaturas;

    if (this.filtroEstado === 'activas') lista = lista.filter(a => a.estado);
    if (this.filtroEstado === 'inactivas') lista = lista.filter(a => !a.estado);

    if (!this.filtroBusqueda) return lista;
    const q = this.filtroBusqueda.toLowerCase().trim();
    return lista.filter(a =>
      (a.nombre || '').toLowerCase().includes(q) ||
      (a.codigo || '').toLowerCase().includes(q)
    );
  }

  limpiarFiltro(): void {
    this.filtroBusqueda = '';
  }
}