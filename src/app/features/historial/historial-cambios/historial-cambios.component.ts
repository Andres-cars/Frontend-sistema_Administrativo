// src/app/features/historial/historial-cambios/historial-cambios.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout } from 'rxjs';

import { HistorialService } from '../../../core/services/historial.service';

@Component({
  selector: 'app-historial-cambios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-cambios.component.html',
  styleUrls: ['./historial-cambios.component.css']
})
export class HistorialCambiosComponent implements OnInit {
  registros: any[] = [];
  cargando = false;
  errorMessage = '';

  filtroTabla: '' | 'cargas_horarias' | 'horarios' = '';
  filtroAccion = '';
  busqueda = '';

  readonly acciones = ['CREAR', 'EDITAR', 'ELIMINAR', 'PUBLICAR', 'RETIRAR'];

  constructor(
    private historialService: HistorialService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.errorMessage = '';

    this.historialService.getAll().pipe(timeout(20000)).subscribe({
      next: (response: any) => {
        this.registros = response?.data || [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.cargando = false;
        this.errorMessage = error?.status === 0
          ? 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.'
          : (error?.error?.message || 'Error al cargar el historial');
        this.cdr.detectChanges();
      }
    });
  }

  // ===== Filtros =====
  get filtrados(): any[] {
    const texto = this.busqueda.trim().toLowerCase();
    return this.registros.filter(r => {
      if (this.filtroTabla && r.tabla !== this.filtroTabla) return false;
      if (this.filtroAccion && r.accion !== this.filtroAccion) return false;
      if (!texto) return true;
      return (r.descripcion || '').toLowerCase().includes(texto) ||
             (r.usuario?.usuario || '').toLowerCase().includes(texto);
    });
  }

  contar(tabla: string): number {
    return this.registros.filter(r => r.tabla === tabla).length;
  }

  // ===== Etiquetas =====
  tablaLabel(tabla: string): string {
    return tabla === 'cargas_horarias' ? 'Carga horaria' : tabla === 'horarios' ? 'Horario' : tabla;
  }

  accionLabel(accion: string): string {
    const nombres: Record<string, string> = {
      CREAR: 'Creó', EDITAR: 'Editó', ELIMINAR: 'Eliminó', PUBLICAR: 'Publicó', RETIRAR: 'Retiró'
    };
    return nombres[accion] || accion;
  }

  accionClase(accion: string): string {
    return 'accion-' + (accion || '').toLowerCase();
  }
}