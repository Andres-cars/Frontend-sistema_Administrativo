// src/app/features/admins/lista-admins/lista-admins.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-lista-admins',
  templateUrl: './lista-admins.component.html',
  styleUrls: ['./lista-admins.component.css']
})
export class ListaAdminsComponent implements OnInit {
  admins: any[] = [];
  loading = false;
  errorMessage = '';
  successMessage: string = '';
  usuarioActual: any = null;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
     private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUsuario();
     const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['successMessage']) {

      this.successMessage =
        navigation.extras.state['successMessage'];

      setTimeout(() => {
this.cdr.detectChanges();
        this.successMessage = '';

        

      }, 3500);
    }
    this.cargarAdmins();
  }

  cargarAdmins(): void {
    this.loading = true;
    this.adminService.getAll().subscribe({
      next: (res) => {
        this.admins = res.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al cargar';
      },
    });
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
  eliminarAdmin(id: number): void {
    if (id === this.usuarioActual?.id) {
      alert('No puedes eliminar tu propio usuario');
      return;
    }
    if (!confirm('¿Eliminar este administrador?')) return;

    this.adminService.delete(id).subscribe({
      next: () => this.cargarAdmins(),
      error: (err) => alert(err.error?.message || 'Error al eliminar'),
    });
  }
}