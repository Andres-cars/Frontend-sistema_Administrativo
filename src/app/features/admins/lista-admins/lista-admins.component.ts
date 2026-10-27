// src/app/features/admins/lista-admins/lista-admins.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-lista-admins',
  templateUrl: './lista-admins.component.html',
  styleUrls: ['./lista-admins.component.css'],
  standalone: true,
  imports: [CommonModule, RouterOutlet, ConfirmDialogComponent]
})
export class ListaAdminsComponent implements OnInit, OnDestroy {

  admins: any[] = [];
  loading = false;
  errorMessage = '';
  usuarioActual: any = null;

  // Toast flotante
  successTitle: string = '';
  successMessage: string = '';
  private toastTimer: any;

  // Confirmación de eliminar
  eliminando: { id: number; nombre: string } | null = null;
  eliminandoCargando = false;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUsuario();

    // Si venimos de guardar, mostrar aviso
    const state = this.router.getCurrentNavigation()?.extras?.state;
    if (state?.['successMessage']) {
      this.mostrarToast(state['successTitle'] || '¡Éxito!', state['successMessage']);
    }

    this.cargarAdmins();
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

    this.cargarAdmins();
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

  cargarAdmins(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getAll().subscribe({
      next: (res) => {
        this.admins = (res.data || []).sort((a: any, b: any) => a.id - b.id);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al cargar administradores';
        this.cdr.detectChanges();
      }
    });
  }

  esUsuarioActual(admin: any): boolean {
    return admin.id === this.usuarioActual?.id;
  }

  irACrear(): void {
    this.router.navigate(['/admins/crear']);
  }

  irAEditar(id: number): void {
    this.router.navigate([`/admins/editar/${id}`]);
  }

  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // ===== ELIMINAR CON CONFIRMACIÓN =====

  // 1. Al presionar 🗑️: abre el diálogo
  pedirEliminar(admin: any): void {
    if (this.esUsuarioActual(admin)) {
      this.errorMessage = 'No puedes eliminar tu propio usuario';
      return;
    }
    this.eliminando = { id: admin.id, nombre: admin.usuario };
  }

  // 2. Al presionar Cancelar, Esc o clic afuera: cierra el diálogo
  cancelarEliminar(): void {
    this.eliminando = null;
  }

  // 3. Al presionar "Sí, eliminar": elimina de verdad
  confirmarEliminar(): void {
    if (!this.eliminando) return;
    this.eliminandoCargando = true;

    this.adminService.delete(this.eliminando.id).subscribe({
      next: () => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.mostrarToast('Administrador eliminado', 'El registro se eliminó correctamente.');
        this.cargarAdmins();
      },
      error: (err) => {
        this.eliminandoCargando = false;
        this.eliminando = null;
        this.errorMessage = err.error?.message || 'Error al eliminar administrador';
        this.cdr.detectChanges();
      }
    });
  }
}