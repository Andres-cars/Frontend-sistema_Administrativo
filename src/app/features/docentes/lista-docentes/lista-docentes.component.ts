import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { DocenteService } from '../../../core/services/docente.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lista-docentes',
  templateUrl: './lista-docentes.component.html',
  styleUrls: ['./lista-docentes.component.css']
})
export class ListaDocentesComponent implements OnInit {

  docentes: any[] = [];

  loading: boolean = false;

  errorMessage: string = '';

  successMessage: string = '';

  isAdmin: boolean = false;

  constructor(
    private docenteService: DocenteService,
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

    this.cargarDocentes();
  }

  cargarDocentes(): void {

    this.loading = true;
    this.errorMessage = '';

    console.log('📡 Cargando docentes...');

    this.docenteService.getAll().subscribe({

      next: (response) => {

        console.log('✅ Respuesta recibida:', response);

        console.log('👨‍🏫 Datos:', response.data);

        this.docentes = response.data || [];

        this.loading = false;

        console.log('📊 Total docentes:', this.docentes.length);

        console.log('🔄 Loading:', this.loading);

        // Forzar actualización visual
        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error('❌ Error al cargar docentes:', error);

        this.loading = false;

        this.errorMessage =
          error.error?.message ||
          'Error al cargar docentes';

        // Forzar actualización visual
        this.cdr.detectChanges();
      }

    });
  }

  irACrear(): void {

    this.router.navigate(['/docentes/crear']);

  }

  irAEditar(id: number): void {

    this.router.navigate([
      `/docentes/editar/${id}`
    ]);

  }

  eliminarDocente(id: number): void {

    if (!confirm('¿Estás seguro de eliminar este docente?')) {
      return;
    }

    this.docenteService.delete(id).subscribe({

      next: () => {

        console.log('🗑️ Docente eliminado');

        this.cargarDocentes();

      },

      error: (error) => {

        alert(
          error.error?.message ||
          'Error al eliminar docente'
        );

        console.error('❌ Error:', error);

      }

    });

  }

  // ✅ NUEVO: regresar al dashboard principal
  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }

}