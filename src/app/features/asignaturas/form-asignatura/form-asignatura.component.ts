// src/app/features/asignaturas/form-asignatura/form-asignatura.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AsignaturaService } from '../../../core/services/asignatura.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-asignatura',
  templateUrl: './form-asignatura.component.html',
  styleUrls: ['./form-asignatura.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class FormAsignaturaComponent implements OnInit {
  asignatura: any = {
    nombre: '',
    codigo: '',
    horas_semanales: 1
  };
  isEdit: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private asignaturaService: AsignaturaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.cargarAsignatura(id);
    }
  }

  cargarAsignatura(id: number): void {
    this.loading = true;
    this.asignaturaService.getById(id).subscribe({
      next: (response) => {
        this.asignatura = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar asignatura';
      }
    });
  }

  onSubmit(): void {
    if (!this.asignatura.nombre || !this.asignatura.horas_semanales) {
      this.errorMessage = 'Nombre y horas semanales son obligatorios';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      nombre: this.asignatura.nombre,
      codigo: this.asignatura.codigo,
      horas_semanales: this.asignatura.horas_semanales
    };

    if (this.isEdit) {
      this.asignaturaService.update(this.asignatura.id, data).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = '✅ Asignatura actualizada correctamente';
          setTimeout(() => this.router.navigate(['/asignaturas']), 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al actualizar asignatura';
        }
      });
    } else {
      this.asignaturaService.create(data).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = '✅ Asignatura creada correctamente';
          setTimeout(() => this.router.navigate(['/asignaturas']), 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al crear asignatura';
        }
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/asignaturas']);
  }
  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}