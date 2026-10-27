// src/app/features/cargas-horarias/form-carga/form-carga.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  imports: [CommonModule, FormsModule],
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
    private router: Router,
    private cdr: ChangeDetectorRef
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
        // ✅ Ordenados por apellido para encontrarlos fácil
        this.docentes = (response.data || []).sort((a: any, b: any) =>
          (a.apellidos || '').localeCompare(b.apellidos || '', 'es'));
        this.cdr.detectChanges();
      }
    });
  }

  cargarAsignaturas(): void {
    this.asignaturaService.getAll().subscribe({
      next: (response) => {
        // ✅ Ordenadas por nombre
        this.asignaturas = (response.data || []).sort((a: any, b: any) =>
          (a.nombre || '').localeCompare(b.nombre || '', 'es'));
        this.cdr.detectChanges();
      }
    });
  }

  cargarCursos(): void {
    this.cursoService.getAll().subscribe({
      next: (response) => {
        // ✅ Ordenados por ID (respeta el orden en que se crearon)
        this.cursos = (response.data || []).sort((a: any, b: any) => a.id - b.id);
        this.cdr.detectChanges();
      }
    });
  }

  cargarCarga(id: number): void {
    this.loading = true;
    this.cargaService.getById(id).subscribe({
      next: (response) => {
        this.carga = response.data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar carga horaria';
        this.cdr.detectChanges();
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
      // ===== EDITAR =====
      this.cargaService.update(this.carga.id, data).subscribe({
        next: () => {
          this.loading = false;
          // ✅ Cierra el modal y manda el aviso a la lista
          this.router.navigate(['/cargas-horarias'], {
            state: {
              successTitle: 'Carga horaria actualizada',
              successMessage: 'Los cambios se guardaron correctamente.'
            }
          });
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al actualizar';
          this.cdr.detectChanges();
        }
      });
    } else {
      // ===== CREAR =====
      this.cargaService.create(data).subscribe({
        next: () => {
          this.loading = false;
          // ✅ Cierra el modal y manda el aviso a la lista
          this.router.navigate(['/cargas-horarias'], {
            state: {
              successTitle: 'Carga horaria creada',
              successMessage: 'La carga horaria se registró correctamente.'
            }
          });
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al crear';
          this.cdr.detectChanges();
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