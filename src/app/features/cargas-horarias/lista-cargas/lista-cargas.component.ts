// src/app/features/cargas-horarias/lista-cargas/lista-cargas.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CargaHorariaService } from '../../../core/services/carga-horaria.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-lista-cargas',
  templateUrl: './lista-cargas.component.html',
  styleUrls: ['./lista-cargas.component.css']
})
export class ListaCargasComponent implements OnInit {
  cargas: any[] = [];
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isAdmin: boolean = false;

  constructor(
    private cargaService: CargaHorariaService,
    private authService: AuthService,
    private router: Router,
      private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
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
    this.cargarCargas();
  }

  cargarCargas(): void {
    this.loading = true;
    this.errorMessage = '';
    console.log('📡 Cargando Cargas Horarias...');
    this.cargaService.getAll().subscribe({
      next: (response) => {
        console.log('✅ Respuesta recibida:', response);
        console.log('👨‍🏫 Datos:', response.data);
        this.cargas = response.data || [];
        this.loading = false;
        console.log('✅ Cargas cargadas:', this.cargas.length);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar cargas horarias';
      }
    });
  }

  irACrear(): void {
    this.router.navigate(['/cargas-horarias/crear']);
  }

  irAEditar(id: number): void {
    this.router.navigate([`/cargas-horarias/editar/${id}`]);
  }

  eliminarCarga(id: number): void {
    if (!confirm('¿Estás seguro de eliminar esta carga horaria?')) return;

    this.cargaService.delete(id).subscribe({
      next: () => {
        this.cargarCargas();
      },
      error: (error) => {
        alert(error.error?.message || 'Error al eliminar carga horaria');
      }
    });
  }
   irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}