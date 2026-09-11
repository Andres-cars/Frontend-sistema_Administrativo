// src/app/features/cursos/form-curso/form-curso.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CursoService } from '../../../core/services/curso.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-form-curso',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './form-curso.component.html',
  styleUrls: ['./form-curso.component.css']
})
export class FormCursoComponent implements OnInit {
  curso: any = {
    nivel: '',
    grado: '',
    paralelo: ''
  };
  isEdit: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Opciones para los selects
  niveles = [
    'Educación Inicial',
    'Educación General Básica',
    'Bachillerato General Unificado'
  ];

  grados = [
    '1ro', '2do', '3ro', '4to', '5to', '6to', '7mo',
    '8vo', '9no', '10mo',
    '1ro BGU', '2do BGU', '3ro BGU'
  ];

  paralelos = ['A', 'B', 'C', 'D'];

  constructor(
    private cursoService: CursoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.cargarCurso(id);
    }
  }

  cargarCurso(id: number): void {
    this.loading = true;
    this.cursoService.getById(id).subscribe({
      next: (response) => {
        this.curso = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar curso';
      }
    });
  }

  onSubmit(): void {
    if (!this.curso.nivel || !this.curso.grado || !this.curso.paralelo) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      nivel: this.curso.nivel,
      grado: this.curso.grado,
      paralelo: this.curso.paralelo
    };

    if (this.isEdit) {
      this.cursoService.update(this.curso.id, data).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = '✅ Curso actualizado correctamente';
          setTimeout(() => this.router.navigate(['/cursos']), 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al actualizar curso';
        }
      });
    } else {
      this.cursoService.create(data).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = '✅ Curso creado correctamente';
          setTimeout(() => this.router.navigate(['/cursos']), 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al crear curso';
        }
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/cursos']);
  }
   // ✅ NUEVO: regresar al dashboard principal
  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}