// src/app/features/aulas/lista-aulas/lista-aulas.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AulaService } from '../../../core/services/aula.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-lista-aulas',
  templateUrl: './lista-aulas.component.html',
  styleUrls: ['./lista-aulas.component.css']
})
export class ListaAulasComponent implements OnInit {
  aulas: any[] = [];
  loading: boolean = false;
  errorMessage: string = '';
   successMessage: string = '';
  isAdmin: boolean = false;

  constructor(
    private aulaService: AulaService,
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
    this.cargarAulas();
  }

  cargarAulas(): void {
    this.loading = true;
    this.errorMessage = '';
    console.log('📡 Cargando Aulas...');
    this.aulaService.getAll().subscribe({
      next: (response) => {
        console.log('✅ Respuesta recibida:', response);
        console.log('👨‍🏫 Datos:', response.data);
        this.aulas = response.data || [];
        this.loading = false;
        console.log('✅ Aulas cargadas:', this.aulas.length);
         console.log('🔄 Loading:', this.loading);
          this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar aulas';
         console.error('❌ Error:', error);
      }
    });
  }

  irACrear(): void {
    this.router.navigate(['/aulas/crear']);
  }

  irAEditar(id: number): void {
    this.router.navigate([`/aulas/editar/${id}`]);
  }

  eliminarAula(id: number): void {
    if (!confirm('¿Estás seguro de eliminar esta aula?')) return;

    this.aulaService.delete(id).subscribe({
      next: () => {
        this.cargarAulas();
      },
      error: (error) => {
        alert(error.error?.message || 'Error al eliminar aula');
      }
    });
  }
   irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}