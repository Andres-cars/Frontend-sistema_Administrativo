// src/app/features/cargas-horarias/form-carga/form-carga.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CargaHorariaService } from '../../../core/services/carga-horaria.service';
import { DocenteService } from '../../../core/services/docente.service';
import { AsignaturaService } from '../../../core/services/asignatura.service';
import { CursoService } from '../../../core/services/curso.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-form-carga',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './form-carga.component.html',
  styleUrls: ['./form-carga.component.css']
})
export class FormCargaComponent implements OnInit {
  carga: any = {
    docente_id: '',
    asignatura_id: '',
    curso_id: '',
    periodo_id: 1,
    horas_semanales: 1
  };
  isEdit: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Listas para los selects
  docentes: any[] = [];
  asignaturas: any[] = [];
  cursos: any[] = [];
  periodos: any[] = [
    { id: 1, nombre: 'Periodo Académico 2026-2027' }
  ];

  constructor(
    private cargaService: CargaHorariaService,
    private docenteService: DocenteService,
    private asignaturaService: AsignaturaService,
    private cursoService: CursoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDocentes();
    this.cargarAsignaturas();
    this.cargarCursos();

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.cargarCarga(id);
    }
  }

  cargarDocentes(): void {
    this.docenteService.getAll().subscribe({
      next: (response) => {
        this.docentes = response.data || [];
      }
    });
  }

  cargarAsignaturas(): void {
    this.asignaturaService.getAll().subscribe({
      next: (response) => {
        this.asignaturas = response.data || [];
      }
    });
  }

  cargarCursos(): void {
    this.cursoService.getAll().subscribe({
      next: (response) => {
        this.cursos = response.data || [];
      }
    });
  }

  cargarCarga(id: number): void {
    this.loading = true;
    this.cargaService.getById(id).subscribe({
      next: (response) => {
        this.carga = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar carga horaria';
      }
    });
  }

  onSubmit(): void {
    if (!this.carga.docente_id || !this.carga.asignatura_id || !this.carga.curso_id || !this.carga.horas_semanales) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      docente_id: Number(this.carga.docente_id),
      asignatura_id: Number(this.carga.asignatura_id),
      curso_id: Number(this.carga.curso_id),
      periodo_id: Number(this.carga.periodo_id),
      horas_semanales: Number(this.carga.horas_semanales)
    };

    if (this.isEdit) {
      this.cargaService.update(this.carga.id, data).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = '✅ Carga horaria actualizada correctamente';
          setTimeout(() => this.router.navigate(['/cargas-horarias']), 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al actualizar';
        }
      });
    } else {
      this.cargaService.create(data).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = '✅ Carga horaria creada correctamente';
          setTimeout(() => this.router.navigate(['/cargas-horarias']), 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al crear';
        }
      });
    }
  }
  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }
  cancelar(): void {
    this.router.navigate(['/cargas-horarias']);
  }
}