// src/app/features/cursos/lista-cursos/lista-cursos.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CursoService } from '../../../core/services/curso.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lista-cursos',
  templateUrl: './lista-cursos.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  styleUrls: ['./lista-cursos.component.css']
})
export class ListaCursosComponent implements OnInit {
  cursos: any[] = [];
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isAdmin: boolean = false;

  constructor(
    private cursoService: CursoService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();

    console.log('📋 isAdmin:', this.isAdmin);

    // Revisar si venimos de guardar un docente
    const navigation = this.router.getCurrentNavigation();

    if (navigation?.extras?.state?.['successMessage']) {

      this.successMessage =
        navigation.extras.state['successMessage'];

      setTimeout(() => {

        this.successMessage = '';

        this.cdr.detectChanges();

      }, 3500);
    }
    this.cargarCursos();
  }

  cargarCursos(): void {
    this.loading = true;
    this.errorMessage = '';
     console.log('📡 Cargando Cursos...');

    this.cursoService.getAll().subscribe({
      next: (response) => {
        console.log('✅ Respuesta recibida:', response);

        console.log('👨‍🏫 Datos:', response.data);
        this.cursos = response.data || [];
        this.loading = false;
        console.log('✅ Cursos cargados:', this.cursos.length);

        console.log('🔄 Loading:', this.loading);

        // Forzar actualización visual
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar cursos';
        console.error('❌ Error:', error);
      }
    });
  }

  irACrear(): void {
    this.router.navigate(['/cursos/crear']);
  }

  irAEditar(id: number): void {
    this.router.navigate([`/cursos/editar/${id}`]);
  }

  eliminarCurso(id: number): void {
    if (!confirm('¿Estás seguro de eliminar este curso?')) return;

    this.cursoService.delete(id).subscribe({
      next: () => {
        this.cargarCursos();
      },
      error: (error) => {
        alert(error.error?.message || 'Error al eliminar curso');
        console.error('❌ Error:', error);
      }
    });
  }
   // ✅ NUEVO: regresar al dashboard principal
  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}