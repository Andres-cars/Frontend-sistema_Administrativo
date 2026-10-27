// src/app/features/cursos/form-curso/form-curso.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CursoService } from '../../../core/services/curso.service';
import { AulaService } from '../../../core/services/aula.service'; // ✅ NUEVO IMPORT
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-curso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-curso.component.html',
  styleUrls: ['./form-curso.component.css']
})
export class FormCursoComponent implements OnInit {
  curso: any = {
    nivel: '',
    grado: '',
    paralelo: '',
    tipo_educacion: 'BASICA',
    aula_id: null // ✅ NUEVO CAMPO
  };
  isEdit: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  niveles = ['Educación Inicial', 'Educación General Básica', 'Bachillerato General Unificado'];
  grados = ['Inicial', '1ro', '2do', '3ro', '4to', '5to', '6to', '7mo', '8vo', '9no', '10mo', '1ro BGU', '2do BGU', '3ro BGU'];
  paralelos = ['A', 'B', 'C', 'D'];

  aulas: any[] = []; // ✅ NUEVA LISTA

  constructor(
    private cursoService: CursoService,
    private aulaService: AulaService, // ✅ INYECTAMOS SERVICIO
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarAulas(); // ✅ CARGAMOS LAS AULAS
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.cargarCurso(id);
    }
  }

  cargarAulas(): void {
    this.aulaService.getAll().subscribe({
      next: (res: any) => {
        this.aulas = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar aulas', err)
    });
  }

    cargarCurso(id: number): void {
    this.loading = true;
    this.cursoService.getById(id).subscribe({
      next: (response) => {
        this.curso = response.data;
        
        // ✅ FORZAMOS A QUE SE SELECCIONE EL AULA CORRECTA EN EL SELECT
        if (this.curso.aula_id) {
          this.curso.aula_id = Number(this.curso.aula_id); 
        }
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar curso';
        this.cdr.detectChanges();
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
      paralelo: this.curso.paralelo,
      tipo_educacion: this.curso.tipo_educacion,
      aula_id: this.curso.aula_id ? Number(this.curso.aula_id) : null// ✅ ENVIAMOS EL AULA
    };

    if (this.isEdit) {
      this.cursoService.update(this.curso.id, data).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = '✅ Curso actualizado correctamente';
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/cursos']), 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al actualizar curso';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.cursoService.create(data).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = '✅ Curso creado correctamente';
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/cursos']), 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al crear curso';
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/cursos']);
  }

  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}