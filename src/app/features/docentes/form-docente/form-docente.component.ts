// src/app/features/docentes/form-docente/form-docente.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DocenteService } from '../../../core/services/docente.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-form-docente',
  templateUrl: './form-docente.component.html',
  styleUrls: ['./form-docente.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class FormDocenteComponent implements OnInit {
  docente: any = {
    nombres: '',
    apellidos: '',
    identificacion: '',
    especialidad: '',
    usuario: '',
    password: ''
  };
  isEdit: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private docenteService: DocenteService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.cargarDocente(id);
    }
  }

  cargarDocente(id: number): void {
    this.loading = true;
    this.docenteService.getById(id).subscribe({
      next: (response) => {
        this.docente = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar docente';
        console.error('❌ Error:', error);
      }
    });
  }

  onSubmit(): void {
    // Validaciones básicas
    if (!this.docente.nombres || !this.docente.apellidos) {
      this.errorMessage = 'Nombres y apellidos son obligatorios';
      return;
    }

    // Si es nuevo y se proporciona usuario, la contraseña es obligatoria
    if (!this.isEdit && this.docente.usuario && !this.docente.password) {
      this.errorMessage = 'La contraseña es obligatoria si se crea un usuario';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      nombres: this.docente.nombres,
      apellidos: this.docente.apellidos,
      identificacion: this.docente.identificacion,
      especialidad: this.docente.especialidad,
      usuario: this.docente.usuario,
      password: this.docente.password
    };

    if (this.isEdit) {
      // Editar
      this.docenteService.update(this.docente.id, data).subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = '✅ Docente actualizado correctamente';
          setTimeout(() => this.router.navigate(['/docentes']), 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al actualizar docente';
          console.error('❌ Error:', error);
        }
      });
    } else {

      // Crear
      this.docenteService.create(data).subscribe({

  next: (response) => {

    this.loading = false;

    console.log('✅ Docente creado:', response);

    this.router.navigate(['/docentes'], {
      state: {
        successMessage: 'Docente guardado correctamente'
      }
    });

  },

  error: (error) => {

    this.loading = false;

    this.errorMessage =
      error.error?.message ||
      'Error al crear docente';

    console.error('❌ Error:', error);
  }

});
    }
  }

  cancelar(): void {
    this.router.navigate(['/docentes']);
  }

  // ✅ NUEVO: regresar al dashboard principal
  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}