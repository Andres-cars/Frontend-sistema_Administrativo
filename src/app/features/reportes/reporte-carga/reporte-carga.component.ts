// src/app/features/reportes/reporte-carga/reporte-carga.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

// ⚠️ Si tu servicio tiene otro nombre o ruta, copia el import que usa form-carga
import { CargaHorariaService } from '../../../core/services/carga-horaria.service';
import { DocenteService } from '../../../core/services/docente.service';

interface DetalleCarga {
  asignatura: string;
  curso: string;
  horas: number;
}

interface FilaReporte {
  docenteId: number;
  docente: string;
  identificacion: string;
  detalles: DetalleCarga[];
  cursos: number;
  horas: number;
}

@Component({
  selector: 'app-reporte-carga',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-carga.component.html',
  styleUrls: ['./reporte-carga.component.css']
})
export class ReporteCargaComponent implements OnInit {
  readonly MAX_HORAS = 30;

  cargas: any[] = [];
  docentes: any[] = [];

  periodos: { id: number; nombre: string }[] = [];
  periodoId: number | null = null;

  busqueda = '';
  filtro: 'todos' | 'supera' | 'sin-carga' = 'todos';

  cargando = false;
  errorMessage = '';
  exportando = false;

  constructor(
    private cargaService: CargaHorariaService,
    private docenteService: DocenteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ============================================
  // CARGAR DATOS (cargas + docentes)
  // ============================================
  cargarDatos(): void {
    this.cargando = true;
    this.errorMessage = '';

    forkJoin({
      cargas: this.cargaService.getAll().pipe(timeout(20000)),
      docentes: this.docenteService.getAll().pipe(
        timeout(20000),
        catchError(() => of({ data: [] }))   // si falla, el reporte sale solo con cargas
      )
    }).subscribe({
      next: ({ cargas, docentes }: any) => {
        this.cargas = (cargas?.data || []).filter((c: any) => c.estado !== false);
        this.docentes = (docentes?.data || []).filter((d: any) => d.estado !== false);

        // Periodos disponibles (sacados de las cargas)
        const mapa = new Map<number, string>();
        this.cargas.forEach(c => {
          const id = c.periodo_id ?? c.periodo?.id;
          if (id) mapa.set(id, c.periodo?.nombre || `Periodo ${id}`);
        });
        this.periodos = [...mapa.entries()].map(([id, nombre]) => ({ id, nombre }));
        if (!this.periodoId && this.periodos.length) {
          this.periodoId = this.periodos[this.periodos.length - 1].id;
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.cargando = false;
        this.errorMessage = error?.status === 0
          ? 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.'
          : (error?.error?.message || 'Error al cargar el reporte');
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================
  // CÁLCULO DEL REPORTE
  // ============================================
  get filasBase(): FilaReporte[] {
    const filas = new Map<number, FilaReporte>();

    // 1) Todos los docentes activos (aunque no tengan carga)
    this.docentes.forEach(d => {
      filas.set(d.id, {
        docenteId: d.id,
        docente: `${d.apellidos || ''} ${d.nombres || ''}`.trim(),
        identificacion: d.identificacion || '',
        detalles: [],
        cursos: 0,
        horas: 0
      });
    });

    // 2) Sumar las cargas del periodo seleccionado
    this.cargas
      .filter(c => !this.periodoId || (c.periodo_id ?? c.periodo?.id) === this.periodoId)
      .forEach(c => {
        const id = c.docente_id ?? c.docente?.id;
        if (!id) return;

        if (!filas.has(id)) {
          filas.set(id, {
            docenteId: id,
            docente: `${c.docente?.apellidos || ''} ${c.docente?.nombres || ''}`.trim() || `Docente ${id}`,
            identificacion: '',
            detalles: [],
            cursos: 0,
            horas: 0
          });
        }

        const fila = filas.get(id)!;
        const horas = Number(c.horas_semanales) || 0;
        fila.horas += horas;
        fila.detalles.push({
          asignatura: c.asignatura?.nombre || 'Asignatura',
          curso: c.curso ? `${c.curso.grado} "${c.curso.paralelo}"` : '',
          horas
        });
      });

    // 3) Cursos distintos por docente
    filas.forEach(f => {
      f.cursos = new Set(f.detalles.map(d => d.curso)).size;
    });

    // Orden: más horas primero, luego por nombre
    return [...filas.values()].sort((a, b) => b.horas - a.horas || a.docente.localeCompare(b.docente));
  }

  get filas(): FilaReporte[] {
    const texto = this.busqueda.trim().toLowerCase();
    return this.filasBase.filter(f => {
      if (this.filtro === 'supera' && f.horas <= this.MAX_HORAS) return false;
      if (this.filtro === 'sin-carga' && f.horas > 0) return false;
      if (!texto) return true;
      return f.docente.toLowerCase().includes(texto) ||
             f.identificacion.includes(texto) ||
             f.detalles.some(d => d.asignatura.toLowerCase().includes(texto));
    });
  }

  // ===== Resumen =====
  get totalDocentes(): number { return this.filasBase.length; }
  get totalHoras(): number { return this.filasBase.reduce((s, f) => s + f.horas, 0); }
  get docentesSupera(): number { return this.filasBase.filter(f => f.horas > this.MAX_HORAS).length; }
  get docentesSinCarga(): number { return this.filasBase.filter(f => f.horas === 0).length; }
  get promedioHoras(): number {
    const conCarga = this.filasBase.filter(f => f.horas > 0);
    return conCarga.length ? Math.round((this.totalHoras / conCarga.length) * 10) / 10 : 0;
  }

  get nombrePeriodo(): string {
    return this.periodos.find(p => p.id === this.periodoId)?.nombre || 'Todos los periodos';
  }

  // ===== Ayudas de la vista =====
  porcentaje(horas: number): number {
    return Math.min(100, Math.round((horas / this.MAX_HORAS) * 100));
  }

  estadoDe(f: FilaReporte): { texto: string; clase: string } {
    if (f.horas > this.MAX_HORAS) return { texto: `Supera ${this.MAX_HORAS} h`, clase: 'supera' };
    if (f.horas === this.MAX_HORAS) return { texto: 'Completa', clase: 'completa' };
    if (f.horas === 0) return { texto: 'Sin carga', clase: 'sin-carga' };
    return { texto: 'Disponible', clase: 'normal' };
  }

  // ============================================
  // EXPORTAR A EXCEL
  // ============================================
  async exportarExcel(): Promise<void> {
    if (this.exportando) return;
    this.exportando = true;
    this.cdr.detectChanges();

    try {
      const mod: any = await import('exceljs');
      const ExcelJS = mod.default ?? mod;

      const libro = new ExcelJS.Workbook();
      const hoja = libro.addWorksheet('Carga por docente');

      hoja.mergeCells('A1:F1');
      hoja.getCell('A1').value = 'Unidad Educativa Si Miao Wei Hua';
      hoja.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFA91B2E' } };

      hoja.mergeCells('A2:F2');
      hoja.getCell('A2').value = `Reporte de carga horaria por docente · ${this.nombrePeriodo}`;
      hoja.getCell('A2').font = { bold: true, size: 12 };

      hoja.mergeCells('A3:F3');
      hoja.getCell('A3').value =
        `Máximo semanal: ${this.MAX_HORAS} h · Docentes que superan: ${this.docentesSupera} · Generado: ${new Date().toLocaleString('es-EC')}`;
      hoja.getCell('A3').font = { size: 10, color: { argb: 'FF6B6D75' } };

      const encabezado = hoja.addRow(['N°', 'Docente', 'Asignaturas y cursos', 'Cursos', 'Horas semanales', 'Estado']);
      encabezado.eachCell((celda: any) => {
        celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA91B2E' } };
        celda.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      this.filas.forEach((f, i) => {
        const detalle = f.detalles.map(d => `${d.asignatura} · ${d.curso} (${d.horas} h)`).join('\n') || '—';
        const fila = hoja.addRow([i + 1, f.docente, detalle, f.cursos, f.horas, this.estadoDe(f).texto]);
        fila.alignment = { vertical: 'top', wrapText: true };
        fila.getCell(1).alignment = { vertical: 'top', horizontal: 'center' };
        fila.getCell(4).alignment = { vertical: 'top', horizontal: 'center' };
        fila.getCell(5).alignment = { vertical: 'top', horizontal: 'center' };

        if (f.horas > this.MAX_HORAS) {
          fila.eachCell((celda: any) => {
            celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDECEE' } };
          });
          fila.getCell(5).font = { bold: true, color: { argb: 'FFB91C1C' } };
          fila.getCell(6).font = { bold: true, color: { argb: 'FFB91C1C' } };
        }
      });

      const total = hoja.addRow(['', 'TOTAL', '', '', this.filas.reduce((s, f) => s + f.horas, 0), '']);
      total.font = { bold: true };
      total.getCell(5).alignment = { horizontal: 'center' };

      hoja.columns = [
        { width: 6 }, { width: 32 }, { width: 50 }, { width: 9 }, { width: 16 }, { width: 14 }
      ];

      const buffer = await libro.xlsx.writeBuffer();
      this.descargar(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `reporte-carga-docentes.xlsx`
      );
    } catch (e) {
      console.error('❌ Error al exportar Excel:', e);
      this.errorMessage = 'No se pudo exportar el Excel';
    } finally {
      this.exportando = false;
      this.cdr.detectChanges();
    }
  }

  // ============================================
  // EXPORTAR A PDF
  // ============================================
  async exportarPDF(): Promise<void> {
    if (this.exportando) return;
    this.exportando = true;
    this.cdr.detectChanges();

    try {
      const { jsPDF } = await import('jspdf');
      const autoTableMod: any = await import('jspdf-autotable');
      const autoTable = autoTableMod.default ?? autoTableMod.autoTable;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      doc.setFontSize(15);
      doc.setTextColor(169, 27, 46);
      doc.text('Unidad Educativa Si Miao Wei Hua', 14, 15);

      doc.setFontSize(11);
      doc.setTextColor(23, 24, 28);
      doc.text(`Reporte de carga horaria por docente · ${this.nombrePeriodo}`, 14, 22);

      doc.setFontSize(9);
      doc.setTextColor(107, 109, 117);
      doc.text(
        `Máximo semanal: ${this.MAX_HORAS} h   ·   Docentes: ${this.totalDocentes}   ·   ` +
        `Superan ${this.MAX_HORAS} h: ${this.docentesSupera}   ·   Generado: ${new Date().toLocaleString('es-EC')}`,
        14, 28
      );

      const filas = this.filas;

      autoTable(doc, {
        startY: 33,
        head: [['N°', 'Docente', 'Asignaturas y cursos', 'Cursos', 'Horas', 'Estado']],
        body: filas.map((f, i) => [
          i + 1,
          f.docente,
          f.detalles.map(d => `${d.asignatura} · ${d.curso} (${d.horas} h)`).join('\n') || '—',
          f.cursos,
          f.horas,
          this.estadoDe(f).texto
        ]),
        foot: [['', 'TOTAL', '', '', filas.reduce((s, f) => s + f.horas, 0), '']],
        styles: { fontSize: 8.5, cellPadding: 2.5, valign: 'top' },
        headStyles: { fillColor: [169, 27, 46], textColor: 255, halign: 'center' },
        footStyles: { fillColor: [243, 241, 236], textColor: [23, 24, 28], fontStyle: 'bold' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { cellWidth: 60 },
          3: { halign: 'center', cellWidth: 18 },
          4: { halign: 'center', cellWidth: 18 },
          5: { halign: 'center', cellWidth: 28 }
        },
        didParseCell: (data: any) => {
          if (data.section === 'body' && filas[data.row.index]?.horas > this.MAX_HORAS) {
            data.cell.styles.fillColor = [253, 236, 238];
            if (data.column.index >= 4) {
              data.cell.styles.textColor = [185, 28, 28];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      doc.save('reporte-carga-docentes.pdf');
    } catch (e) {
      console.error('❌ Error al exportar PDF:', e);
      this.errorMessage = 'No se pudo exportar el PDF';
    } finally {
      this.exportando = false;
      this.cdr.detectChanges();
    }
  }

  private descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }
}