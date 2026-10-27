// src/app/features/asignaturas/lista-asignaturas/lista-asignaturas.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router'; // ✅ MODAL
import { AsignaturaService } from '../../../core/services/asignatura.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lista-asignaturas',
  templateUrl: './lista-asignaturas.component.html',
  styleUrls: ['./lista-asignaturas.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterOutlet] // ✅ MODAL
})
export class ListaAsignaturasComponent implements OnInit {
  asignaturas: any[] = [];
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isAdmin: boolean = false;
  filtroBusqueda: string = '';

  constructor(
    private asignaturaService: AsignaturaService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();

    console.log('📋 isAdmin:', this.isAdmin);

    // Revisar si venimos de guardar una asignatura
    const navigation = this.router.getCurrentNavigation();

    if (navigation?.extras?.state?.['successMessage']) {
      this.successMessage = navigation.extras.state['successMessage'];

      setTimeout(() => {
        this.successMessage = '';
        this.cdr.detectChanges(); // ✅ ahora va después de borrar el mensaje
      }, 3500);
    }
    this.cargarAsignaturas();
  }

  // ✅ MODAL: se ejecuta cuando el formulario se cierra (guardar o cancelar)
  alCerrarFormulario(): void {
    const msg = this.router.getCurrentNavigation()?.extras?.state?.['successMessage'];

    if (msg) {
      this.successMessage = msg;
      setTimeout(() => {
        this.successMessage = '';
        this.cdr.detectChanges();
      }, 3500);
    }

    this.cargarAsignaturas();
  }

  cargarAsignaturas(): void {
    this.loading = true;
    this.errorMessage = '';
    console.log('📡 Cargando Asignaturas...');

    this.asignaturaService.getAll().subscribe({
      next: (response) => {
        console.log('✅ Respuesta recibida:', response);
        console.log('👨‍🏫 Datos:', response.data);
        this.asignaturas = response.data || [];
        this.loading = false;
        console.log('✅ Asignaturas cargadas:', this.asignaturas.length);
        console.log('🔄 Loading:', this.loading);
        // Forzar actualización visual
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar asignaturas';
        this.cdr.detectChanges(); // ✅
      }
    });
  }

  irACrear(): void {
    this.router.navigate(['/asignaturas/crear']);
  }

  irAEditar(id: number): void {
    this.router.navigate([`/asignaturas/editar/${id}`]);
  }

  eliminarAsignatura(id: number): void {
    if (!confirm('¿Estás seguro de eliminar esta asignatura?')) return;

    this.asignaturaService.delete(id).subscribe({
      next: () => {
        this.cargarAsignaturas();
      },
      error: (error) => {
        alert(error.error?.message || 'Error al eliminar asignatura');
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