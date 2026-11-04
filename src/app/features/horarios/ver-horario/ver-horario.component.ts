// src/app/features/horarios/ver-horario/ver-horario.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HorarioService } from '../../../core/services/horario.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Fila {
  inicio: string;   // '07:30'
  fin: string;      // '08:10'
  recreo?: boolean;
}

// Horario del colegio: 8vo a 3ro BGU (07:30 - 13:05, recreo 10:30 - 10:50)
const FILAS_COLEGIO: Fila[] = [
  { inicio: '07:30', fin: '08:15' },
  { inicio: '08:15', fin: '09:00' },
  { inicio: '09:00', fin: '09:45' },
  { inicio: '09:45', fin: '10:30' },
  { inicio: '10:30', fin: '10:50', recreo: true },
  { inicio: '10:50', fin: '11:35' },
  { inicio: '11:35', fin: '12:20' },
  { inicio: '12:20', fin: '13:05' },
];

// Horario de la escuela: Inicial a 7mo (07:30 - 12:00, recreo 10:00 - 10:30)
const FILAS_ESCUELA: Fila[] = [
  { inicio: '07:30', fin: '08:10' },
  { inicio: '08:10', fin: '08:50' },
  { inicio: '08:50', fin: '09:30' },
  { inicio: '09:30', fin: '10:00' },
  { inicio: '10:00', fin: '10:30', recreo: true },
  { inicio: '10:30', fin: '11:15' },
  { inicio: '11:15', fin: '12:00' },
];

@Component({
  selector: 'app-ver-horario',
  templateUrl: './ver-horario.component.html',
  styleUrls: ['./ver-horario.component.css']
})
export class VerHorarioComponent implements OnInit {
  horario: any = null;
  loading: boolean = true;
  errorMessage: string = '';

  dias: string[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];
  filas: Fila[] = FILAS_COLEGIO;
  esEscuela: boolean = false;

  grid: any = {};

  constructor(
    private horarioService: HorarioService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.cargarHorario(id);
    }
  }

  cargarHorario(id: number): void {
    this.loading = true;
    this.horarioService.getById(id).subscribe({
      next: (response) => {
        this.horario = response.data;
        this.elegirFilas();
        this.construirGrid();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al cargar horario';
        this.loading = false;
      }
    });
  }

  // Decide si el horario es de la escuela o del colegio según el curso
  // (misma regla que el backend: BGU/Bachillerato y 8vo-10mo son colegio)
  elegirFilas(): void {
    const curso = this.horario?.detalles?.[0]?.carga_horaria?.curso;
    const grado = String(curso?.grado ?? '');
    const nivel = String(curso?.nivel ?? '');

    const esColegio =
      /BGU/i.test(grado) ||
      /bachillerato/i.test(nivel) ||
      /^(8|9|10)\D*$/.test(grado.trim()) ||
      /^(8|9|10)(vo|no|mo)/i.test(grado.trim());

    this.esEscuela = !!curso && !esColegio;
    this.filas = this.esEscuela ? FILAS_ESCUELA : FILAS_COLEGIO;
  }

  construirGrid(): void {
    this.grid = {};

    for (const dia of this.dias) {
      this.grid[dia] = {};
      for (const fila of this.filas) {
        if (!fila.recreo) this.grid[dia][fila.inicio] = null;
      }
    }

    if (this.horario?.detalles) {
      for (const detalle of this.horario.detalles) {
        const dia = detalle.dia_semana;
        const hora = String(detalle.hora_inicio).substring(0, 5); // '07:30:00' -> '07:30'

        if (this.grid[dia] && this.grid[dia][hora] !== undefined) {
          this.grid[dia][hora] = detalle;
        } else {
          console.warn(`Clase fuera de la grilla: ${dia} ${hora}`, detalle);
        }
      }
    }
  }

  getClase(dia: string, hora: string): any {
    return this.grid[dia]?.[hora] || null;
  }

  volver(): void {
    this.router.navigate(['/horarios']);
  }

  imprimir(): void {
    window.print();
  }

  // ===================== EXPORTAR =====================

  // Texto de una celda: "Asignatura\nDocente\nAula"
  private textoClase(clase: any): string {
    if (!clase) return '';
    const ch = clase.carga_horaria;
    const docente = [ch?.docente?.nombres, ch?.docente?.apellidos].filter(Boolean).join(' ');
    return [ch?.asignatura?.nombre, docente, clase.aula?.nombre].filter(Boolean).join('\n');
  }

  // Tabla lista para exportar: encabezado + una fila por bloque
  private tablaExport(): { encabezado: string[]; filas: string[][] } {
    const encabezado = ['HORA', ...this.dias];
    const filas = this.filas.map(f => {
      const hora = `${f.inicio} - ${f.fin}`;
      if (f.recreo) return [hora, 'RECREO', '', '', '', ''];
      return [hora, ...this.dias.map(d => this.textoClase(this.getClase(d, f.inicio)))];
    });
    return { encabezado, filas };
  }

  private nombreArchivo(): string {
    return (this.horario?.nombre || 'horario')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  exportarExcel(): void {
    const { encabezado, filas } = this.tablaExport();
    const titulo = [
      ['Unidad Educativa Si Miao Wei Hua'],
      [this.horario?.nombre || 'Horario'],
      [this.esEscuela ? 'Escuela (07:30 - 12:00)' : 'Colegio (07:30 - 13:05)'],
      [],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...titulo, encabezado, ...filas]);

    ws['!cols'] = [{ wch: 14 }, ...this.dias.map(() => ({ wch: 28 }))];
    // Unir las celdas del recreo
    const merges: XLSX.Range[] = [];
    this.filas.forEach((f, i) => {
      if (f.recreo) {
        const r = titulo.length + 1 + i;
        merges.push({ s: { r, c: 1 }, e: { r, c: this.dias.length } });
      }
    });
    ws['!merges'] = merges;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Horario');
    XLSX.writeFile(wb, `${this.nombreArchivo()}.xlsx`);
  }

  exportarPDF(): void {
    const { encabezado, filas } = this.tablaExport();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(14);
    doc.text('Unidad Educativa Si Miao Wei Hua', 14, 14);
    doc.setFontSize(11);
    doc.text(this.horario?.nombre || 'Horario', 14, 21);
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(this.esEscuela ? 'Escuela (07:30 - 12:00)' : 'Colegio (07:30 - 13:05)', 14, 27);

    const cuerpo: any[] = filas.map(fila =>
      fila[1] === 'RECREO'
        ? [fila[0], { content: 'RECREO', colSpan: this.dias.length,
            styles: { halign: 'center', fontStyle: 'bold', textColor: [192, 86, 33], fillColor: [253, 250, 245] } }]
        : fila
    );

    autoTable(doc, {
      startY: 32,
      head: [encabezado],
      body: cuerpo,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
      headStyles: { fillColor: [45, 55, 72], textColor: 255, halign: 'center' },
      columnStyles: { 0: { cellWidth: 26, fontStyle: 'bold', halign: 'center' } },
    });

    doc.save(`${this.nombreArchivo()}.pdf`);
  }

  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}