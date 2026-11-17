// src/app/features/mi-horario/mi-horario.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Workbook } from 'exceljs';                 // ✅ EXPORTAR
import { jsPDF } from 'jspdf';                      // ✅ EXPORTAR
import autoTable from 'jspdf-autotable';            // ✅ EXPORTAR

import { HorarioService } from '../../core/services/horario.service';

interface Clase {
  id: number;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  asignatura: string;
  curso: string;
  nivel: string;
  aula: string;
  horario: string;
}

interface Fila {
  inicio: string;
  fin: string;
}

@Component({
  selector: 'app-mi-horario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-horario.component.html',
  styleUrls: ['./mi-horario.component.css']
})
export class MiHorarioComponent implements OnInit, OnDestroy {

  docente: any = null;
  cargas: any[] = [];
  clases: Clase[] = [];
  totalHoras = 0;

  loading = true;
  errorMessage = '';

  // Buscador
  filtro = '';

  // Aviso cuando el guard lo regresa aquí
  avisoMensaje = '';
  private avisoTimer: any;

  // ✅ EXPORTAR: qué se está generando ahora
  exportando: 'excel' | 'pdf' | null = null;

  dias = [
    { clave: 'LUNES', label: 'Lunes' },
    { clave: 'MARTES', label: 'Martes' },
    { clave: 'MIERCOLES', label: 'Miércoles' },
    { clave: 'JUEVES', label: 'Jueves' },
    { clave: 'VIERNES', label: 'Viernes' }
  ];

  filas: Fila[] = [];

  private paleta = [
    { fondo: '#fbeaec', borde: '#a91b2e' },
    { fondo: '#e7f0fd', borde: '#2563eb' },
    { fondo: '#fef3e2', borde: '#ea8c1a' },
    { fondo: '#e8f5e9', borde: '#2e7d32' },
    { fondo: '#f1eafe', borde: '#7c3aed' },
    { fondo: '#e6f6f7', borde: '#0e7c86' },
    { fondo: '#fdf2f8', borde: '#be185d' },
    { fondo: '#f3f4f6', borde: '#4b5563' }
  ];
  private colorPorAsignatura = new Map<string, { fondo: string; borde: string }>();

  constructor(
    private horarioService: HorarioService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const state = this.router.getCurrentNavigation()?.extras?.state;
    if (state?.['avisoAcceso']) {
      this.mostrarAviso(state['avisoAcceso']);
    }

    this.cargar();
  }

  ngOnDestroy(): void {
    clearTimeout(this.avisoTimer);
  }

  cargar(): void {
    this.loading = true;
    this.errorMessage = '';

    this.horarioService.misClases().subscribe({
      next: (res) => {
        const data = res.data || {};
        this.docente = data.docente || null;
        this.cargas = data.cargas || [];
        this.clases = data.clases || [];
        this.totalHoras = data.totalHoras || 0;
        this.construirFilas();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'No se pudo cargar tu horario';
        this.cdr.detectChanges();
      }
    });
  }

  private construirFilas(): void {
    const mapa = new Map<string, Fila>();
    for (const c of this.clases) {
      const actual = mapa.get(c.hora_inicio);
      if (!actual || c.hora_fin > actual.fin) {
        mapa.set(c.hora_inicio, { inicio: c.hora_inicio, fin: c.hora_fin });
      }
    }
    this.filas = [...mapa.values()].sort((a, b) => a.inicio.localeCompare(b.inicio));
  }

  claseEn(dia: string, inicio: string): Clase | undefined {
    return this.clases.find(c => c.dia === dia && c.hora_inicio === inicio);
  }

  // ===== Datos para la cabecera =====
  get nombreCompleto(): string {
    return this.docente ? `${this.docente.nombres} ${this.docente.apellidos}` : '';
  }

  get totalCursos(): number {
    return new Set(this.cargas.map(c => c.curso + c.nivel)).size;
  }

  get clasesHoy(): number {
    const hoy = this.diaDeHoy();
    return hoy ? this.clases.filter(c => c.dia === hoy).length : 0;
  }

  private diaDeHoy(): string | null {
    const claves = ['', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', ''];
    return claves[new Date().getDay()] || null;
  }

  esHoy(dia: string): boolean {
    return this.diaDeHoy() === dia;
  }

  // ===== Buscador =====
  private normalizar(texto: any): string {
    return (texto ?? '').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  coincide(c: Clase): boolean {
    const q = this.normalizar(this.filtro);
    if (!q) return true;
    const texto = this.normalizar(`${c.dia} ${c.asignatura} ${c.curso} ${c.nivel} ${c.aula}`);
    return texto.includes(q);
  }

  get totalCoincidencias(): number {
    return this.clases.filter(c => this.coincide(c)).length;
  }

  // ===== Colores por materia =====
  colorDe(asignatura: string): { fondo: string; borde: string } {
    if (!this.colorPorAsignatura.has(asignatura)) {
      const i = this.colorPorAsignatura.size % this.paleta.length;
      this.colorPorAsignatura.set(asignatura, this.paleta[i]);
    }
    return this.colorPorAsignatura.get(asignatura)!;
  }

  // ===== Aviso =====
  mostrarAviso(mensaje: string): void {
    this.avisoMensaje = mensaje;
    clearTimeout(this.avisoTimer);
    this.avisoTimer = setTimeout(() => {
      this.avisoMensaje = '';
      this.cdr.detectChanges();
    }, 5000);
  }

  cerrarAviso(): void {
    clearTimeout(this.avisoTimer);
    this.avisoMensaje = '';
  }

  // =====================================================
  // ✅ EXPORTAR
  // =====================================================

  // Ej: "Horario_Baque_Tumbaco_Katty_Gabriela"
  private get nombreArchivo(): string {
    const base = this.docente ? `Horario ${this.docente.apellidos} ${this.docente.nombres}` : 'Mi horario';
    return this.normalizar(base).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
      .replace(/(^|_)([a-z])/g, (_, s, l) => s + l.toUpperCase());
  }

  private get subtitulo(): string {
    return `Unidad Educativa Si Miao Wei Hua · Periodo lectivo 2026-2027 · ${this.totalHoras} horas semanales`;
  }

  private textoCelda(c: Clase | undefined): string {
    return c ? [c.asignatura, c.curso, c.aula].filter(Boolean).join('\n') : '';
  }

  private hexARgb(hex: string): [number, number, number] {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  private descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ----- EXCEL -----
  async exportarExcel(): Promise<void> {
    if (this.exportando) return;
    this.exportando = 'excel';

    try {
      const wb = new Workbook();
      wb.creator = 'Sistema de gestión académica';

      // Hoja 1: horario
      const ws = wb.addWorksheet('Mi horario', {
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
      });
      ws.columns = [{ width: 15 }, { width: 26 }, { width: 26 }, { width: 26 }, { width: 26 }, { width: 26 }];

      ws.mergeCells(1, 1, 1, 6);
      ws.getCell(1, 1).value = `Horario de ${this.nombreCompleto}`;
      ws.getCell(1, 1).font = { bold: true, size: 15, color: { argb: 'FF17181C' } };

      ws.mergeCells(2, 1, 2, 6);
      ws.getCell(2, 1).value = this.subtitulo;
      ws.getCell(2, 1).font = { size: 10, color: { argb: 'FF6B6D75' } };

      const borde = { style: 'thin' as const, color: { argb: 'FFE5E2DB' } };
      const bordes = { top: borde, left: borde, bottom: borde, right: borde };

      const cabecera = ws.getRow(4);
      cabecera.values = ['Hora', ...this.dias.map(d => d.label)];
      cabecera.height = 22;
      cabecera.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA91B2E' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = bordes;
      });

      this.filas.forEach((f, i) => {
        const row = ws.getRow(5 + i);
        row.height = 52;

        const celdaHora = row.getCell(1);
        celdaHora.value = `${f.inicio} - ${f.fin}`;
        celdaHora.font = { bold: true };
        celdaHora.alignment = { horizontal: 'center', vertical: 'middle' };
        celdaHora.border = bordes;

        this.dias.forEach((d, j) => {
          const c = this.claseEn(d.clave, f.inicio);
          const cell = row.getCell(2 + j);
          cell.value = this.textoCelda(c);
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = bordes;
          if (c) {
            const color = this.colorDe(c.asignatura).fondo.replace('#', '').toUpperCase();
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + color } };
          }
        });
      });

      // Hoja 2: carga horaria
      const ws2 = wb.addWorksheet('Carga horaria');
      ws2.columns = [
        { header: 'Asignatura', key: 'asignatura', width: 30 },
        { header: 'Curso', key: 'curso', width: 14 },
        { header: 'Nivel', key: 'nivel', width: 34 },
        { header: 'Horas / semana', key: 'horas', width: 16 }
      ];
      ws2.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA91B2E' } };
        cell.border = bordes;
      });
      this.cargas.forEach(c => {
        ws2.addRow({ asignatura: c.asignatura, curso: c.curso, nivel: c.nivel, horas: c.horas_semanales })
          .eachCell(cell => (cell.border = bordes));
      });
      const total = ws2.addRow({ asignatura: 'Total', horas: this.totalHoras });
      total.font = { bold: true };

      const buffer = await wb.xlsx.writeBuffer();
      this.descargar(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `${this.nombreArchivo}.xlsx`
      );
    } catch (e) {
      console.error('❌ Error al exportar Excel:', e);
      this.mostrarAviso('No se pudo generar el archivo Excel.');
    } finally {
      this.exportando = null;
      this.cdr.detectChanges();
    }
  }

  // ----- PDF -----
  exportarPdf(): void {
    if (this.exportando) return;
    this.exportando = 'pdf';

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const rojo: [number, number, number] = [169, 27, 46];

      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(23, 24, 28);
      doc.text(`Horario de ${this.nombreCompleto}`, 14, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(107, 109, 117);
      doc.text(this.subtitulo, 14, 22);

      // Tabla del horario
      autoTable(doc, {
        startY: 28,
        head: [['Hora', ...this.dias.map(d => d.label)]],
        body: this.filas.map(f => [
          `${f.inicio}\n${f.fin}`,
          ...this.dias.map(d => this.textoCelda(this.claseEn(d.clave, f.inicio)))
        ]),
        theme: 'grid',
        styles: {
          fontSize: 8, cellPadding: 2, halign: 'center', valign: 'middle',
          lineColor: [229, 226, 219], lineWidth: 0.2, minCellHeight: 14
        },
        headStyles: { fillColor: rojo, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 22, fontStyle: 'bold' } },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index > 0) {
            const f = this.filas[data.row.index];
            const d = this.dias[data.column.index - 1];
            const c = f && d ? this.claseEn(d.clave, f.inicio) : undefined;
            if (c) {
              data.cell.styles.fillColor = this.hexARgb(this.colorDe(c.asignatura).fondo);
            }
          }
        }
      });

      // Carga horaria
      let y = (doc as any).lastAutoTable.finalY + 10;
      if (y > 175) {
        doc.addPage();
        y = 16;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(23, 24, 28);
      doc.text('Mi carga horaria', 14, y);

      autoTable(doc, {
        startY: y + 4,
        head: [['Asignatura', 'Curso', 'Nivel', 'Horas / semana']],
        body: this.cargas.map(c => [c.asignatura, c.curso, c.nivel, `${c.horas_semanales} h`]),
        foot: [['Total', '', '', `${this.totalHoras} h`]],
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: rojo, textColor: 255 },
        footStyles: { fillColor: [247, 246, 243], textColor: [23, 24, 28], fontStyle: 'bold' },
        columnStyles: { 3: { halign: 'right' } }
      });

      // Pie de página
      const fecha = new Date().toLocaleDateString('es-EC');
      const paginas = doc.getNumberOfPages();
      for (let i = 1; i <= paginas; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150, 152, 160);
        doc.text(`Generado el ${fecha} · Sistema de gestión académica`, 14, 203);
        doc.text(`Página ${i} de ${paginas}`, 283, 203, { align: 'right' });
      }

      doc.save(`${this.nombreArchivo}.pdf`);
    } catch (e) {
      console.error('❌ Error al exportar PDF:', e);
      this.mostrarAviso('No se pudo generar el archivo PDF.');
    } finally {
      this.exportando = null;
      this.cdr.detectChanges();
    }
  }
}