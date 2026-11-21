// src/app/features/periodos/lista-periodos/lista-periodos.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout } from 'rxjs';

import { PeriodoService } from '../../../core/services/periodo.service';

@Component({
  selector: 'app-lista-periodos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-periodos.component.html',
  styleUrls: ['./lista-periodos.component.css']
})
export class ListaPeriodosComponent implements OnInit {
  periodos: any[] = [];
  loading = false;
  errorMessage = '';

  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';
  cambiandoId: number | null = null;

  // Toast
  successTitle = '';
  successMessage = '';
  private toastTimer: any = null;

  // Ventana (modal) para crear / editar
  mostrarForm = false;
  editandoId: number | null = null;
  form = { nombre: '', fecha_inicio: '', fecha_fin: '' };
  guardando = false;
  formError = '';

  constructor(
    private periodoService: PeriodoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  // ============================================
  // CARGAR
  // ============================================
  cargar(): void {
    this.loading = true;
    this.errorMessage = '';

    this.periodoService.getAll(true).pipe(timeout(20000)).subscribe({
      next: (response: any) => {
        this.periodos = response?.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.status === 0
          ? 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.'
          : (error?.error?.message || 'Error al cargar los periodos académicos');
        this.cdr.detectChanges();
      }
    });
  }

  // ===== Filtros y datos de la vista =====
  get periodosFiltrados(): any[] {
    if (this.filtroEstado === 'activos') return this.periodos.filter(p => p.estado);
    if (this.filtroEstado === 'inactivos') return this.periodos.filter(p => !p.estado);
    return this.periodos;
  }

  get totalActivos(): number { return this.periodos.filter(p => p.estado).length; }
  get totalInactivos(): number { return this.periodos.filter(p => !p.estado).length; }

  // El periodo actual es el activo más reciente (la lista llega ordenada del más reciente al más antiguo)
  get actualId(): number | null {
    return this.periodos.find(p => p.estado)?.id ?? null;
  }

  // '2026-10-01' → '01/10/2026' (sin pasar por Date, para que no cambie de día por la zona horaria)
  fecha(valor: string): string {
    if (!valor) return '—';
    const [a, m, d] = String(valor).slice(0, 10).split('-');
    return `${d}/${m}/${a}`;
  }

  meses(p: any): number {
    const [a1, m1] = String(p.fecha_inicio).split('-').map(Number);
    const [a2, m2] = String(p.fecha_fin).split('-').map(Number);
    return (a2 - a1) * 12 + (m2 - m1) + 1;
  }

  // ============================================
  // CREAR / EDITAR
  // ============================================
  abrirCrear(): void {
    this.editandoId = null;
    this.formError = '';

    // Sugerencia: el año lectivo siguiente al más reciente
    const ultimo = this.periodos[0];
    if (ultimo) {
      const sumarAnio = (f: string) => {
        const [a, m, d] = String(f).slice(0, 10).split('-');
        return `${Number(a) + 1}-${m}-${d}`;
      };
      const inicio = sumarAnio(ultimo.fecha_inicio);
      const fin = sumarAnio(ultimo.fecha_fin);
      this.form = {
        nombre: `Periodo Académico ${inicio.slice(0, 4)}-${fin.slice(0, 4)}`,
        fecha_inicio: inicio,
        fecha_fin: fin
      };
    } else {
      this.form = { nombre: '', fecha_inicio: '', fecha_fin: '' };
    }
    this.mostrarForm = true;
  }

  abrirEditar(p: any): void {
    this.editandoId = p.id;
    this.formError = '';
    this.form = {
      nombre: p.nombre,
      fecha_inicio: String(p.fecha_inicio).slice(0, 10),
      fecha_fin: String(p.fecha_fin).slice(0, 10)
    };
    this.mostrarForm = true;
  }

  cerrarForm(): void {
    if (this.guardando) return;
    this.mostrarForm = false;
  }

  guardar(): void {
    if (this.guardando) return;
    this.formError = '';

    const { nombre, fecha_inicio, fecha_fin } = this.form;
    if (!nombre.trim() || !fecha_inicio || !fecha_fin) {
      this.formError = 'Completa el nombre y las dos fechas.';
      return;
    }
    if (fecha_fin <= fecha_inicio) {
      this.formError = 'La fecha de fin debe ser posterior a la fecha de inicio.';
      return;
    }

    this.guardando = true;
    const esEdicion = this.editandoId !== null;
    const peticion = esEdicion
      ? this.periodoService.update(this.editandoId!, this.form)
      : this.periodoService.create(this.form);

    peticion.pipe(timeout(20000)).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarForm = false;
        this.mostrarToast(
          esEdicion ? 'Periodo actualizado' : 'Periodo creado',
          `${nombre.trim()} se guardó correctamente.`
        );
        this.cargar();
      },
      error: (error) => {
        this.guardando = false;
        this.formError = error?.error?.message || 'No se pudo guardar el periodo.';
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================
  // ACTIVAR / DESACTIVAR
  // ============================================
  cambiarEstado(p: any): void {
    if (this.cambiandoId) return;
    this.cambiandoId = p.id;
    this.errorMessage = '';
    const nuevo = !p.estado;

    this.periodoService.cambiarEstado(p.id, nuevo).pipe(timeout(20000)).subscribe({
      next: () => {
        this.cambiandoId = null;
        this.mostrarToast(
          nuevo ? 'Periodo activado' : 'Periodo desactivado',
          nuevo ? `${p.nombre} vuelve a aparecer en los selectores.`
                : `${p.nombre} ya no aparece en los selectores. Sus datos se conservan.`
        );
        this.cargar();
      },
      error: (error) => {
        this.cambiandoId = null;
        this.errorMessage = error?.error?.message || 'No se pudo cambiar el estado del periodo.';
        this.cdr.detectChanges();
      }
    });
  }

  // ===== Toast =====
  private mostrarToast(titulo: string, mensaje: string): void {
    this.successTitle = titulo;
    this.successMessage = mensaje;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.cerrarToast(), 4000);
    this.cdr.detectChanges();
  }

  cerrarToast(): void {
    this.successMessage = '';
    this.cdr.detectChanges();
  }
}