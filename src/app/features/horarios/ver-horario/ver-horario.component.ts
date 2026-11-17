// src/app/features/horarios/ver-horario/ver-horario.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { Workbook } from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { HorarioService } from '../../../core/services/horario.service';
import { colorAsignatura, hexARgb, hexAArgb, ColorAsignatura } from '../../../core/utils/colores-asignatura';

interface ClaseVista {
  dia: string;
  inicio: string;
  fin: string;
  asignatura: string;
  docente: string;
  aula: string;
}

interface FilaVista {
  tipo: 'clase' | 'recreo';
  inicio: string;
  fin: string;
}

interface Leyenda {
  asignatura: string;
  docente: string;
  periodos: number;
}

interface CursoVista {
  id: number;
  nombre: string;
  nivel: string;
  grado: string;
  aula: string;
  clases: ClaseVista[];
  filas: FilaVista[];
  celdas: Map<string, ClaseVista>;
  leyenda: Leyenda[];
}

@Component({
  selector: 'app-ver-horario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-horario.component.html',
  styleUrls: ['./ver-horario.component.css']
})
export class VerHorarioComponent implements OnInit {

  horario: any = null;
  cursos: CursoVista[] = [];
  cursoSel: CursoVista | null = null;

  loading = true;
  errorMessage = '';
  exportando: 'excel' | 'pdf' | 'imprimir' | null = null;

  dias = [
    { clave: 'LUNES', label: 'Lunes' },
    { clave: 'MARTES', label: 'Martes' },
    { clave: 'MIERCOLES', label: 'Miércoles' },
    { clave: 'JUEVES', label: 'Jueves' },
    { clave: 'VIERNES', label: 'Viernes' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private horarioService: HorarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading = false;
      this.errorMessage = 'Horario no válido';
      return;
    }

    this.horarioService.getById(id).subscribe({
      next: (res) => {
        this.procesar(res.data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'No se pudo cargar el horario';
        this.cdr.detectChanges();
      }
    });
  }

  // =====================================================
  // ARMAR LOS DATOS
  // =====================================================
  private procesar(h: any): void {
    this.horario = h;
    const porCurso = new Map<number, CursoVista>();

    for (const d of h?.detalles || []) {
      const carga = d.carga_horaria || {};
      const curso = carga.curso || {};
      const id = Number(curso.id ?? 0);

      if (!porCurso.has(id)) {
        porCurso.set(id, {
          id,
          nombre: `${curso.grado || ''} "${curso.paralelo || ''}"`.trim(),
          nivel: curso.nivel || '',
          grado: curso.grado || '',
          aula: '',
          clases: [],
          filas: [],
          celdas: new Map(),
          leyenda: []
        });
      }

      const cv = porCurso.get(id)!;
      if (!cv.aula && d.aula?.nombre) cv.aula = d.aula.nombre;

      cv.clases.push({
        dia: d.dia_semana,
        inicio: this.hhmm(d.hora_inicio),
        fin: this.hhmm(d.hora_fin),
        asignatura: carga.asignatura?.nombre || 'Sin asignatura',
        docente: carga.docente ? `${carga.docente.nombres} ${carga.docente.apellidos}` : '',
        aula: d.aula?.nombre || ''
      });
    }

    this.cursos = [...porCurso.values()].sort((a, b) => a.id - b.id);

    for (const c of this.cursos) {
      c.celdas = new Map(c.clases.map(x => [`${x.dia}|${x.inicio}`, x] as [string, ClaseVista]));
      c.filas = this.construirFilas(c.clases);
      c.leyenda = this.construirLeyenda(c.clases);
    }

    this.cursoSel = this.cursos[0] || null;
  }

  // Filas = horas de inicio distintas; si hay un hueco ≥ 10 min entre dos horas, es el recreo
  private construirFilas(clases: ClaseVista[]): FilaVista[] {
    const mapa = new Map<string, string>();
    for (const c of clases) {
      const fin = mapa.get(c.inicio);
      if (!fin || c.fin > fin) mapa.set(c.inicio, c.fin);
    }

    const base = [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const filas: FilaVista[] = [];

    base.forEach(([inicio, fin], i) => {
      filas.push({ tipo: 'clase', inicio, fin });
      const siguiente = base[i + 1];
      if (siguiente && this.minutos(siguiente[0]) - this.minutos(fin) >= 10) {
        filas.push({ tipo: 'recreo', inicio: fin, fin: siguiente[0] });
      }
    });

    return filas;
  }

  private construirLeyenda(clases: ClaseVista[]): Leyenda[] {
    const mapa = new Map<string, { docentes: Set<string>; periodos: number }>();
    for (const c of clases) {
      if (!mapa.has(c.asignatura)) mapa.set(c.asignatura, { docentes: new Set(), periodos: 0 });
      const item = mapa.get(c.asignatura)!;
      item.periodos++;
      if (c.docente) item.docentes.add(c.docente);
    }
    return [...mapa.entries()]
      .map(([asignatura, v]) => ({ asignatura, docente: [...v.docentes].join(', '), periodos: v.periodos }))
      .sort((a, b) => b.periodos - a.periodos);
  }

  // =====================================================
  // AYUDAS PARA LA VISTA
  // =====================================================
  celda(c: CursoVista, dia: string, inicio: string): ClaseVista | undefined {
    return c.celdas.get(`${dia}|${inicio}`);
  }

  color(asignatura: string): ColorAsignatura {
    return colorAsignatura(asignatura);
  }

  seleccionar(c: CursoVista): void {
    this.cursoSel = c;
  }

  esColegio(c: CursoVista): boolean {
    return /(8vo|9no|10mo|bgu)/i.test(c.grado) || /bachillerato/i.test(c.nivel);
  }

  rango(c: CursoVista): string {
    if (c.filas.length === 0) return '';
    return `${c.filas[0].inicio} - ${c.filas[c.filas.length - 1].fin}`;
  }

  get periodoTexto(): string {
    const nombre = this.horario?.periodo?.nombre || '';
    return nombre.replace(/^periodo( acad[eé]mico)?\s*/i, '') || '—';
  }

  get jornadaTexto(): string {
    return this.horario?.jornada?.nombre || '—';
  }

  subtitulo(c: CursoVista): string {
    return `Periodo: ${this.periodoTexto} | Jornada: ${this.jornadaTexto} | ` +
      `${this.esColegio(c) ? 'Colegio' : 'Escuela'} (${this.rango(c)})`;
  }

  tituloCurso(c: CursoVista): string {
    if (this.cursos.length > 1) return `${this.horario?.nombre || 'Horario'} · ${c.nombre}`;
    return this.horario?.nombre || `Horario ${c.nombre}`;
  }

  irADashboard(): void { this.router.navigate(['/dashboard']); }
  irAHorarios(): void { this.router.navigate(['/horarios']); }

  private hhmm(valor: any): string {
    return String(valor || '').slice(0, 5);
  }

  private minutos(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  private get nombreArchivo(): string {
    const base = this.horario?.nombre || 'Horario';
    return base.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  private descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }

  // =====================================================
  // EXCEL (una hoja por curso)
  // =====================================================
  async exportarExcel(): Promise<void> {
    if (!this.cursos.length || this.exportando) return;
    this.exportando = 'excel';

    try {
      const wb = new Workbook();
      wb.creator = 'Sistema de gestión académica';
      const usados = new Set<string>();

      for (const c of this.cursos) this.hojaExcel(wb, c, usados);

      const buffer = await wb.xlsx.writeBuffer();
      this.descargar(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `${this.nombreArchivo}.xlsx`
      );
    } catch (e) {
      console.error('❌ Error al exportar Excel:', e);
      this.errorMessage = 'No se pudo generar el archivo Excel.';
    } finally {
      this.exportando = null;
      this.cdr.detectChanges();
    }
  }

  private hojaExcel(wb: Workbook, c: CursoVista, usados: Set<string>): void {
    // Nombre de hoja válido y sin repetir (Excel: máx. 31 caracteres)
    const base = (c.nombre.replace(/[\\/?*[\]:"]/g, '').trim() || 'Horario').slice(0, 28);
    let nombre = base;
    let n = 2;
    while (usados.has(nombre)) nombre = `${base} ${n++}`;
    usados.add(nombre);

    const ws = wb.addWorksheet(nombre, {
      views: [{ showGridLines: false }],
      pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 1 }
    });
    ws.columns = [{ width: 13 }, ...this.dias.map(() => ({ width: 26 }))];

    const linea = { style: 'thin' as const, color: { argb: 'FFE2E8F0' } };
    const bordes = { top: linea, left: linea, bottom: linea, right: linea };

    // Título
    ws.mergeCells(1, 1, 1, 6);
    ws.getCell(1, 1).value = this.tituloCurso(c);
    ws.getCell(1, 1).font = { bold: true, size: 16, color: { argb: 'FF0F172A' } };
    ws.getRow(1).height = 26;

    ws.mergeCells(2, 1, 2, 6);
    ws.getCell(2, 1).value = this.subtitulo(c) + (c.aula ? ` | Aula: ${c.aula}` : '');
    ws.getCell(2, 1).font = { size: 10, color: { argb: 'FF64748B' } };

    // Cabecera
    const cab = ws.getRow(4);
    cab.values = ['HORA', ...this.dias.map(d => d.label.toUpperCase())];
    cab.height = 24;
    cab.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = bordes;
    });

    // Filas
    let r = 5;
    for (const f of c.filas) {
      const row = ws.getRow(r);

      if (f.tipo === 'recreo') {
        row.height = 22;
        const h = row.getCell(1);
        h.value = f.inicio;
        h.font = { bold: true };
        h.alignment = { horizontal: 'center', vertical: 'middle' };
        h.border = bordes;

        ws.mergeCells(r, 2, r, 6);
        const cell = row.getCell(2);
        cell.value = `☕ RECREO (${f.inicio} - ${f.fin})`;
        cell.font = { bold: true, color: { argb: 'FFB45309' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF6EC' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = bordes;
      } else {
        row.height = 44;
        const h = row.getCell(1);
        h.value = {
          richText: [
            { text: f.inicio, font: { bold: true, size: 11 } },
            { text: `\n${f.fin}`, font: { size: 9, color: { argb: 'FF94A3B8' } } }
          ]
        };
        h.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        h.border = bordes;

        this.dias.forEach((d, j) => {
          const cell = row.getCell(2 + j);
          const cl = this.celda(c, d.clave, f.inicio);
          cell.border = bordes;
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };

          if (cl) {
            const col = this.color(cl.asignatura);
            cell.value = {
              richText: [
                { text: cl.asignatura, font: { bold: true, size: 10, color: { argb: hexAArgb(col.texto) } } },
                { text: cl.docente ? `\n${cl.docente}` : '', font: { size: 8.5, color: { argb: 'FF64748B' } } }
              ]
            };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hexAArgb(col.fondo) } };
            cell.border = { ...bordes, left: { style: 'thick', color: { argb: hexAArgb(col.borde) } } };
          }
        });
      }
      r++;
    }

    // Leyenda
    r++;
    ws.getCell(r, 1).value = 'Asignaturas';
    ws.getCell(r, 1).font = { bold: true, size: 11 };
    r++;

    for (const l of c.leyenda) {
      const col = this.color(l.asignatura);
      ws.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hexAArgb(col.borde) } };

      ws.mergeCells(r, 2, r, 3);
      ws.getCell(r, 2).value = l.asignatura;
      ws.getCell(r, 2).font = { bold: true, color: { argb: hexAArgb(col.texto) } };

      ws.mergeCells(r, 4, r, 5);
      ws.getCell(r, 4).value = l.docente || '—';

      ws.getCell(r, 6).value = `${l.periodos} ${l.periodos === 1 ? 'periodo' : 'periodos'}`;
      r++;
    }
  }

  // =====================================================
  // PDF (una página por curso) e IMPRIMIR
  // =====================================================
  exportarPdf(): void {
    if (!this.cursos.length || this.exportando) return;
    this.exportando = 'pdf';
    try {
      this.construirPdf().save(`${this.nombreArchivo}.pdf`);
    } catch (e) {
      console.error('❌ Error al exportar PDF:', e);
      this.errorMessage = 'No se pudo generar el archivo PDF.';
    } finally {
      this.exportando = null;
      this.cdr.detectChanges();
    }
  }

  imprimir(): void {
    if (!this.cursos.length || this.exportando) return;
    this.exportando = 'imprimir';
    try {
      const doc = this.construirPdf();
      doc.autoPrint();
      window.open(doc.output('bloburl').toString(), '_blank');
    } catch (e) {
      console.error('❌ Error al imprimir:', e);
      this.errorMessage = 'No se pudo preparar la impresión.';
    } finally {
      this.exportando = null;
      this.cdr.detectChanges();
    }
  }

  private construirPdf(): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    this.cursos.forEach((c, i) => {
      if (i > 0) doc.addPage();
      this.paginaPdf(doc, c);
    });

    // Pie de página
    const fecha = new Date().toLocaleDateString('es-EC');
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Unidad Educativa Si Miao Wei Hua · Generado el ${fecha}`, 14, 203);
      doc.text(`Página ${i} de ${total}`, 283, 203, { align: 'right' });
    }

    return doc;
  }

  private paginaPdf(doc: jsPDF, c: CursoVista): void {
    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(this.tituloCurso(c), 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(this.subtitulo(c) + (c.aula ? ` | Aula: ${c.aula}` : ''), 14, 21);

    // Tabla
    const body: any[] = c.filas.map(f => {
      if (f.tipo === 'recreo') {
        return [
          f.inicio,
          {
            content: `RECREO (${f.inicio} - ${f.fin})`,
            colSpan: 5,
            styles: { halign: 'center', fillColor: [253, 246, 236], textColor: [180, 83, 9], fontStyle: 'bold', minCellHeight: 8 }
          }
        ];
      }
      return [
        `${f.inicio}\n${f.fin}`,
        ...this.dias.map(d => {
          const cl = this.celda(c, d.clave, f.inicio);
          return cl ? `${cl.asignatura}${cl.docente ? '\n' + cl.docente : ''}` : '';
        })
      ];
    });

    const claseDe = (fila: number, columna: number): ClaseVista | undefined => {
      const f = c.filas[fila];
      if (!f || f.tipo !== 'clase' || columna === 0) return undefined;
      return this.celda(c, this.dias[columna - 1].clave, f.inicio);
    };

    autoTable(doc, {
      startY: 26,
      head: [['HORA', ...this.dias.map(d => d.label.toUpperCase())]],
      body,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: { top: 2, right: 2, bottom: 2, left: 3.5 },
        valign: 'middle',
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        textColor: [30, 41, 59],
        minCellHeight: 13
      },
      headStyles: { fillColor: [31, 41, 55], textColor: 255, fontStyle: 'bold', halign: 'center', minCellHeight: 9 },
      columnStyles: { 0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' } },
      didParseCell: (data) => {
        if (data.section !== 'body') return;
        const cl = claseDe(data.row.index, data.column.index);
        if (cl) {
          const col = this.color(cl.asignatura);
          data.cell.styles.fillColor = hexARgb(col.fondo);
          data.cell.styles.textColor = hexARgb(col.texto);
        }
      },
      didDrawCell: (data) => {
        if (data.section !== 'body') return;
        const cl = claseDe(data.row.index, data.column.index);
        if (cl) {
          // Franja de color a la izquierda, igual que en pantalla
          doc.setFillColor(...hexARgb(this.color(cl.asignatura).borde));
          doc.rect(data.cell.x, data.cell.y, 1.3, data.cell.height, 'F');
        }
      }
    });

    // Leyenda de colores
    let y = (doc as any).lastAutoTable.finalY + 7;
    if (y > 196) return;

    doc.setFontSize(8);
    let x = 14;
    for (const l of c.leyenda) {
      const etiqueta = `${l.asignatura} (${l.periodos})`;
      const ancho = doc.getTextWidth(etiqueta) + 9;
      if (x + ancho > 283) {
        x = 14;
        y += 5.5;
        if (y > 196) break;
      }
      doc.setFillColor(...hexARgb(this.color(l.asignatura).borde));
      doc.roundedRect(x, y - 2.6, 3, 3, 0.6, 0.6, 'F');
      doc.setTextColor(51, 65, 85);
      doc.text(etiqueta, x + 4.5, y);
      x += ancho;
    }
  }
}