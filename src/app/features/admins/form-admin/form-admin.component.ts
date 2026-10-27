// src/app/features/admins/form-admin/form-admin.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-admin',
  templateUrl: './form-admin.component.html',
  styleUrls: ['./form-admin.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class FormAdminComponent implements OnInit {
  admin: any = { usuario: '', password: '' };
  isEdit = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.adminService.getById(id).subscribe({
        next: (res) => {
          this.admin = { ...res.data, password: '' };
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Error al cargar administrador';
          this.cdr.detectChanges();
        }
      });
    }
  }

  onSubmit(): void {
    if (!this.admin.usuario) {
      this.errorMessage = 'El usuario es obligatorio';
      return;
    }

    if (!this.isEdit && !this.admin.password) {
      this.errorMessage = 'La contraseña es obligatoria';
      return;
    }

    if (this.admin.password && this.admin.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const call = this.isEdit
      ? this.adminService.update(this.admin.id, { password: this.admin.password })
      : this.adminService.create({ usuario: this.admin.usuario, password: this.admin.password });

    call.subscribe({
      next: () => {
        this.loading = false;
        // Cierra el modal y manda el aviso a la lista
        this.router.navigate(['/admins'], {
          state: {
            successTitle: this.isEdit ? 'Administrador actualizado' : 'Administrador creado',
            successMessage: this.isEdit
              ? 'Los cambios se guardaron correctamente.'
              : 'El administrador se registró correctamente.'
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al guardar';
        this.cdr.detectChanges();
      }
    });
  }

  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  cancelar(): void {
    this.router.navigate(['/admins']);
  }
}