// src/app/features/aulas/form-aula/form-aula.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AulaService } from '../../../core/services/aula.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-aula',
  templateUrl: './form-aula.component.html',
  styleUrls: ['./form-aula.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class FormAulaComponent implements OnInit {
  aula: any = {
    nombre: '',
    capacidad: null,
    tipo: ''
  };
  isEdit: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  tiposAula = [
    'Aula regular',
    'Laboratorio',
    'Biblioteca',
    'Sala de cómputo',
    'Auditorio',
    'Taller'
  ];

  constructor(
    private aulaService: AulaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.cargarAula(id);
    }
  }

  cargarAula(id: number): void {
    this.loading = true;
    this.aulaService.getById(id).subscribe({
      next: (response) => {
        this.aula = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar aula';
      }
    });
  }

  onSubmit(): void {
    if (!this.aula.nombre) {
      this.errorMessage = 'El nombre del aula es obligatorio';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      nombre: this.aula.nombre,
      capacidad: this.aula.capacidad,
      tipo: this.aula.tipo
    };

    if (this.isEdit) {
      this.aulaService.update(this.aula.id, data).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = '✅ Aula actualizada correctamente';
          setTimeout(() => this.router.navigate(['/aulas']), 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al actualizar aula';
        }
      });
    } else {
      this.aulaService.create(data).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = '✅ Aula creada correctamente';
          setTimeout(() => this.router.navigate(['/aulas']), 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al crear aula';
        }
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/aulas']);
  }
   irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}