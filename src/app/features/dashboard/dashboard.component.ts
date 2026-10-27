// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit, ChangeDetectorRef, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { DocenteService } from '../../core/services/docente.service';
import { CursoService } from '../../core/services/curso.service';
import { AsignaturaService } from '../../core/services/asignatura.service';
import { AulaService } from '../../core/services/aula.service';
import { CargaHorariaService } from '../../core/services/carga-horaria.service'; // ✅ NUEVO

interface ResultadoBusqueda {
  tipo: string;
  icono: string;
  titulo: string;
  detalle: string;
  ruta: string;
  filtro: string;
}

// ✅ NUEVO: cada punto de la lista "Preparación del horario"
interface Chequeo {
  ok: boolean;
  advertencia: boolean; // true = no bloquea, solo avisa
  texto: string;
  ruta: string;
}

// ✅ NUEVO: botones de "Acciones rápidas"
interface AccionRapida {
  icono: string;
  titulo: string;
  detalle: string;
  ruta: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DashboardComponent implements OnInit {

  usuario: any = null;

  // Métricas
  totalDocentes: number | null = null;
  totalCursos: number | null = null;
  totalAsignaturas: number | null = null;
  totalAulas: number | null = null;
  totalCargas: number | null = null; // ✅ NUEVO

  // Estado de carga
  cargandoDocentes = true;
  cargandoCursos = true;
  cargandoAsignaturas = true;
  cargandoAulas = true;
  cargandoCargas = true; // ✅ NUEVO

  // Datos guardados (para buscador y preparación)
  private docentes: any[] = [];
  private cursos: any[] = [];
  private asignaturas: any[] = [];
  private aulas: any[] = [];
  private cargas: any[] = [];

  // Buscador
  textoBusqueda = '';
  resultados: ResultadoBusqueda[] = [];
  mostrarResultados = false;

  // ✅ NUEVO: Preparación del horario
  chequeos: Chequeo[] = [];
  porcentaje = 0;
  estadoPreparacion: 'cargando' | 'incompleto' | 'observaciones' | 'listo' = 'cargando';

  // ✅ NUEVO: Acciones rápidas (abren el modal de crear de cada módulo)
  acciones: AccionRapida[] = [
    { icono: '👨‍🏫', titulo: 'Nuevo docente', detalle: 'Registrar un docente', ruta: '/docentes/crear' },
    { icono: '🏫', titulo: 'Nuevo curso', detalle: 'Nivel, grado y paralelo', ruta: '/cursos/crear' },
    { icono: '📚', titulo: 'Nueva asignatura', detalle: 'Materia y horas semanales', ruta: '/asignaturas/crear' },
    { icono: '🏛️', titulo: 'Nueva aula', detalle: 'Espacio físico disponible', ruta: '/aulas/crear' },
    { icono: '📅', titulo: 'Nueva carga horaria', detalle: 'Asignar materia a un docente', ruta: '/cargas-horarias/crear' },
    { icono: '🗓️', titulo: 'Ver horarios generados', detalle: 'Consultar resultados', ruta: '/horarios' }
  ];

  constructor(
    private authService: AuthService,
    private docenteService: DocenteService,
    private cursoService: CursoService,
    private asignaturaService: AsignaturaService,
    private aulaService: AulaService,
    private cargaService: CargaHorariaService, // ✅ NUEVO
    private router: Router,
    private cdr: ChangeDetectorRef,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();

    this.cargarTotalDocentes();
    this.cargarTotalCursos();
    this.cargarTotalAsignaturas();
    this.cargarTotalAulas();
    this.cargarTotalCargas();
  }

  get esAdmin(): boolean {
    return this.usuario?.rol === 'ADMINISTRADOR';
  }

  // ============================
  // CARGAR MÉTRICAS
  // ============================

  cargarTotalDocentes(): void {
    this.cargandoDocentes = true;
    this.docenteService.getAll().subscribe({
      next: (response: any) => {
        this.docentes = response?.data || [];
        this.totalDocentes = this.docentes.length;
        this.cargandoDocentes = false;
        this.actualizarPreparacion();
      },
      error: (error) => {
        console.error('❌ Error docentes:', error);
        this.totalDocentes = 0;
        this.cargandoDocentes = false;
        this.actualizarPreparacion();
      }
    });
  }

  cargarTotalCursos(): void {
    this.cargandoCursos = true;
    this.cursoService.getAll().subscribe({
      next: (response: any) => {
        this.cursos = response?.data || [];
        this.totalCursos = this.cursos.length;
        this.cargandoCursos = false;
        this.actualizarPreparacion();
      },
      error: (error) => {
        console.error('❌ Error cursos:', error);
        this.totalCursos = 0;
        this.cargandoCursos = false;
        this.actualizarPreparacion();
      }
    });
  }

  cargarTotalAsignaturas(): void {
    this.cargandoAsignaturas = true;
    this.asignaturaService.getAll().subscribe({
      next: (response: any) => {
        this.asignaturas = response?.data || [];
        this.totalAsignaturas = this.asignaturas.length;
        this.cargandoAsignaturas = false;
        this.actualizarPreparacion();
      },
      error: (error) => {
        console.error('❌ Error asignaturas:', error);
        this.totalAsignaturas = 0;
        this.cargandoAsignaturas = false;
        this.actualizarPreparacion();
      }
    });
  }

  cargarTotalAulas(): void {
    this.cargandoAulas = true;
    this.aulaService.getAll().subscribe({
      next: (response: any) => {
        this.aulas = response?.data || [];
        this.totalAulas = this.aulas.length;
        this.cargandoAulas = false;
        this.actualizarPreparacion();
      },
      error: (error) => {
        console.error('❌ Error aulas:', error);
        this.totalAulas = 0;
        this.cargandoAulas = false;
        this.actualizarPreparacion();
      }
    });
  }

  // ✅ NUEVO
  cargarTotalCargas(): void {
    this.cargandoCargas = true;
    this.cargaService.getAll().subscribe({
      next: (response: any) => {
        this.cargas = response?.data || [];
        this.totalCargas = this.cargas.length;
        this.cargandoCargas = false;
        this.actualizarPreparacion();
      },
      error: (error) => {
        console.error('❌ Error cargas:', error);
        this.totalCargas = 0;
        this.cargandoCargas = false;
        this.actualizarPreparacion();
      }
    });
  }

  // ============================
  // ✅ PREPARACIÓN DEL HORARIO
  // ============================

  private plural(n: number, singular: string, plural: string): string {
    return `${n} ${n === 1 ? singular : plural}`;
  }

  actualizarPreparacion(): void {
    const cargando = this.cargandoDocentes || this.cargandoCursos ||
      this.cargandoAsignaturas || this.cargandoAulas || this.cargandoCargas;

    if (cargando) {
      this.estadoPreparacion = 'cargando';
      this.cdr.detectChanges();
      return;
    }

    // Qué docentes y cursos ya tienen al menos una carga horaria
    const docentesConCarga = new Set(
      this.cargas.map(c => Number(c.docente_id ?? c.docente?.id))
    );
    const cursosConCarga = new Set(
      this.cargas.map(c => Number(c.curso_id ?? c.curso?.id))
    );

    const docentesSinCarga = this.docentes.filter(d => !docentesConCarga.has(Number(d.id))).length;
    const cursosSinCarga = this.cursos.filter(c => !cursosConCarga.has(Number(c.id))).length;

    const nD = this.docentes.length;
    const nC = this.cursos.length;
    const nA = this.asignaturas.length;
    const nAu = this.aulas.length;
    const nCa = this.cargas.length;

    this.chequeos = [
      {
        ok: nD > 0, advertencia: false, ruta: '/docentes',
        texto: nD > 0 ? this.plural(nD, 'docente registrado', 'docentes registrados') : 'No hay docentes registrados'
      },
      {
        ok: nC > 0, advertencia: false, ruta: '/cursos',
        texto: nC > 0 ? this.plural(nC, 'curso registrado', 'cursos registrados') : 'No hay cursos registrados'
      },
      {
        ok: nA > 0, advertencia: false, ruta: '/asignaturas',
        texto: nA > 0 ? this.plural(nA, 'asignatura registrada', 'asignaturas registradas') : 'No hay asignaturas registradas'
      },
      {
        ok: nAu > 0, advertencia: false, ruta: '/aulas',
        texto: nAu > 0 ? this.plural(nAu, 'aula disponible', 'aulas disponibles') : 'No hay aulas registradas'
      },
      {
        ok: nCa > 0, advertencia: false, ruta: '/cargas-horarias',
        texto: nCa > 0 ? this.plural(nCa, 'carga horaria asignada', 'cargas horarias asignadas') : 'No hay cargas horarias asignadas'
      },
      {
        ok: docentesSinCarga === 0, advertencia: true, ruta: '/cargas-horarias',
        texto: docentesSinCarga === 0
          ? 'Todos los docentes tienen carga horaria'
          : `${this.plural(docentesSinCarga, 'docente', 'docentes')} sin carga horaria`
      },
      {
        ok: cursosSinCarga === 0, advertencia: true, ruta: '/cargas-horarias',
        texto: cursosSinCarga === 0
          ? 'Todos los cursos tienen materias asignadas'
          : `${this.plural(cursosSinCarga, 'curso', 'cursos')} sin materias asignadas`
      }
    ];

    const cumplidos = this.chequeos.filter(c => c.ok).length;
    this.porcentaje = Math.round((cumplidos / this.chequeos.length) * 100);

    const faltaBasico = this.chequeos.some(c => !c.ok && !c.advertencia);
    const hayAvisos = this.chequeos.some(c => !c.ok && c.advertencia);

    this.estadoPreparacion = faltaBasico ? 'incompleto' : hayAvisos ? 'observaciones' : 'listo';

    this.cdr.detectChanges();
  }

  get textoEstado(): string {
    switch (this.estadoPreparacion) {
      case 'incompleto': return 'Faltan datos';
      case 'observaciones': return 'Listo con observaciones';
      case 'listo': return 'Todo listo';
      default: return 'Revisando...';
    }
  }

  // ============================
  // BUSCADOR
  // ============================

  private normalizar(texto: any): string {
    return (texto ?? '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  buscar(): void {
    const q = this.normalizar(this.textoBusqueda);

    if (q.length < 2) {
      this.resultados = [];
      this.mostrarResultados = false;
      return;
    }

    const r: ResultadoBusqueda[] = [];

    this.docentes
      .filter(d => this.normalizar(`${d.nombres} ${d.apellidos} ${d.identificacion || ''}`).includes(q))
      .slice(0, 4)
      .forEach(d => r.push({
        tipo: 'Docente', icono: '👨‍🏫',
        titulo: `${d.nombres} ${d.apellidos}`,
        detalle: d.identificacion || d.especialidad || '',
        ruta: '/docentes',
        filtro: d.identificacion || d.apellidos || d.nombres
      }));

    this.cursos
      .filter(c => this.normalizar(`${c.nivel} ${c.grado} ${c.paralelo}`).includes(q))
      .slice(0, 4)
      .forEach(c => r.push({
        tipo: 'Curso', icono: '🏫',
        titulo: `${c.grado} "${c.paralelo}"`,
        detalle: c.nivel,
        ruta: '/cursos',
        filtro: `${c.nivel} ${c.grado} "${c.paralelo}"`
      }));

    this.asignaturas
      .filter(a => this.normalizar(`${a.nombre} ${a.codigo || ''}`).includes(q))
      .slice(0, 4)
      .forEach(a => r.push({
        tipo: 'Asignatura', icono: '📚',
        titulo: a.nombre,
        detalle: a.codigo ? `Código: ${a.codigo}` : `${a.horas_semanales} h/semana`,
        ruta: '/asignaturas',
        filtro: a.nombre
      }));

    this.aulas
      .filter(a => this.normalizar(`${a.nombre} ${a.tipo || ''}`).includes(q))
      .slice(0, 4)
      .forEach(a => r.push({
        tipo: 'Aula', icono: '🏛️',
        titulo: a.nombre,
        detalle: a.tipo || (a.capacidad ? `${a.capacidad} estudiantes` : ''),
        ruta: '/aulas',
        filtro: a.nombre
      }));

    this.resultados = r;
    this.mostrarResultados = true;
  }

  irAResultado(r: ResultadoBusqueda): void {
    this.cerrarBusqueda();
    this.router.navigate([r.ruta], { queryParams: { buscar: r.filtro } });
  }

  irAPrimerResultado(): void {
    if (this.resultados.length > 0) {
      this.irAResultado(this.resultados[0]);
    }
  }

  limpiarBusqueda(): void {
    this.textoBusqueda = '';
    this.resultados = [];
    this.mostrarResultados = false;
  }

  cerrarBusqueda(): void {
    this.mostrarResultados = false;
  }

  @HostListener('document:click', ['$event'])
  onClickAfuera(event: MouseEvent): void {
    const buscador = this.elRef.nativeElement.querySelector('.search-wrapper');
    if (buscador && !buscador.contains(event.target)) {
      this.mostrarResultados = false;
    }
  }

  // ============================
  // NAVEGACIÓN
  // ============================

  irA(ruta: string): void { this.router.navigateByUrl(ruta); }

  irADocentes(): void { this.router.navigate(['/docentes']); }
  irACursos(): void { this.router.navigate(['/cursos']); }
  irAAsignaturas(): void { this.router.navigate(['/asignaturas']); }
  irAAulas(): void { this.router.navigate(['/aulas']); }
  irACargas(): void { this.router.navigate(['/cargas-horarias']); }
  irAHorarios(): void { this.router.navigate(['/horarios']); }
  irAAdmins(): void { this.router.navigate(['/admins']); }

  logout(): void {
    this.authService.logout();
  }
}