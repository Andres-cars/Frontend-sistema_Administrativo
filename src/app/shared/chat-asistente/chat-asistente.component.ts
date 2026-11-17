// src/app/shared/chat-asistente/chat-asistente.component.ts
import { Component, ElementRef, ViewChild, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { HorarioService } from '../../core/services/horario.service';
import { DocenteService } from '../../core/services/docente.service';
import { CursoService } from '../../core/services/curso.service';
import { AsignaturaService } from '../../core/services/asignatura.service';
import { AulaService } from '../../core/services/aula.service';
import { CargaHorariaService } from '../../core/services/carga-horaria.service';

interface Mensaje {
  de: 'bot' | 'yo';
  texto: string;
  hora: string;
}

const DIAS = [
  { clave: 'LUNES', label: 'lunes' },
  { clave: 'MARTES', label: 'martes' },
  { clave: 'MIERCOLES', label: 'miércoles' },
  { clave: 'JUEVES', label: 'jueves' },
  { clave: 'VIERNES', label: 'viernes' }
];

// Horario institucional (cámbialo aquí si la institución lo modifica)
const JORNADA =
  'Horario de la jornada (lunes a viernes):\n' +
  '• Entrada: 07:30 para todos\n' +
  '• Escuela (Inicial a 7mo): recreo 10:00–10:30, salida 12:00\n' +
  '• Colegio (8vo a 3ro BGU): recreo 10:30–10:50, salida 13:00';

// Palabras que no son nombres de docentes
const NO_NOMBRES = new Set([
  'docente', 'docentes', 'profesor', 'profesora', 'profe', 'carga', 'horas', 'clases',
  'tiene', 'tienen', 'que', 'cual', 'cuantas', 'cuantos', 'del', 'los', 'las', 'con', 'para'
]);

@Component({
  selector: 'app-chat-asistente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Ventana del chat -->
    @if (abierto) {
      <section class="chat" role="dialog" aria-label="Asistente">

        <header class="chat-head">
          <div class="bot-avatar">🤖</div>
          <div class="chat-titulo">
            <strong>{{ esAdmin ? 'Asistente del sistema' : 'Asistente de horarios' }}</strong>
            <span><i class="punto-verde"></i> En línea · demo</span>
          </div>
          <button type="button" class="chat-cerrar" (click)="toggle()" title="Cerrar">×</button>
        </header>

        <div class="chat-mensajes" #lista>
          @for (m of mensajes; track $index) {
            <div class="msg" [class.yo]="m.de === 'yo'">
              @if (m.de === 'bot') { <div class="msg-avatar">🤖</div> }
              <div class="burbuja">
                <p>{{ m.texto }}</p>
                <time>{{ m.hora }}</time>
              </div>
            </div>
          }

          @if (escribiendo) {
            <div class="msg">
              <div class="msg-avatar">🤖</div>
              <div class="burbuja escribiendo">
                <span></span><span></span><span></span>
              </div>
            </div>
          }
        </div>

        <div class="sugerencias">
          @for (s of sugerencias; track s) {
            <button type="button" class="chip" [disabled]="escribiendo" (click)="enviar(s)">{{ s }}</button>
          }
        </div>

        <form class="chat-input" (ngSubmit)="enviar()">
          <input
            type="text"
            name="mensaje"
            placeholder="Escribe tu pregunta..."
            autocomplete="off"
            [(ngModel)]="texto"
            [disabled]="escribiendo">
          <button type="submit" class="btn-enviar" [disabled]="!texto.trim() || escribiendo" title="Enviar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                 stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </form>
      </section>
    }

    <!-- Botón flotante -->
    <button type="button" class="fab" [class.activo]="abierto" (click)="toggle()"
            [title]="abierto ? 'Cerrar asistente' : 'Abrir asistente'">
      @if (abierto) { × } @else { 💬 }
      @if (noLeidos > 0 && !abierto) { <span class="fab-badge">{{ noLeidos }}</span> }
    </button>
  `,
  styles: [`
    :host {
      --rojo: #a91b2e;
      --rojo-oscuro: #6e0f1e;
      --rojo-claro: #fbeaec;
      --fondo: #f7f6f3;
      --texto: #17181c;
      --borde: #e5e2db;
      font-family: 'Inter', 'IBM Plex Sans', Arial, sans-serif;
    }

    /* ===== BOTÓN FLOTANTE ===== */
    .fab {
      position: fixed; right: 24px; bottom: 24px; z-index: 9000;
      width: 58px; height: 58px; border: none; border-radius: 50%;
      background: linear-gradient(135deg, var(--rojo-oscuro), var(--rojo));
      color: #fff; font-size: 24px; cursor: pointer;
      box-shadow: 0 10px 26px rgba(169, 27, 46, .35);
      transition: transform .2s;
      display: flex; align-items: center; justify-content: center;
    }
    .fab:hover { transform: translateY(-2px) scale(1.04); }
    .fab.activo { font-size: 30px; }
    .fab-badge {
      position: absolute; top: -2px; right: -2px;
      min-width: 20px; height: 20px; padding: 0 5px; border-radius: 999px;
      background: #2e7d32; color: #fff; border: 2px solid #fff;
      font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }

    /* ===== VENTANA ===== */
    .chat {
      position: fixed; right: 24px; bottom: 96px; z-index: 9000;
      width: 380px; height: 560px; max-height: calc(100vh - 120px);
      display: flex; flex-direction: column;
      background: #fff; border: 1px solid var(--borde); border-radius: 20px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, .18);
      overflow: hidden;
      animation: abrir .25s ease;
      transform-origin: bottom right;
    }

    .chat-head {
      display: flex; align-items: center; gap: 11px; padding: 14px 16px;
      background: linear-gradient(135deg, var(--rojo-oscuro), var(--rojo)); color: #fff;
    }
    .bot-avatar {
      width: 38px; height: 38px; flex-shrink: 0; border-radius: 50%;
      background: rgba(255, 255, 255, .18);
      display: flex; align-items: center; justify-content: center; font-size: 19px;
    }
    .chat-titulo { flex: 1; display: flex; flex-direction: column; }
    .chat-titulo strong { font-size: 14px; }
    .chat-titulo span { font-size: 11px; opacity: .85; display: flex; align-items: center; gap: 5px; }
    .punto-verde { width: 7px; height: 7px; border-radius: 50%; background: #6ee7a0; display: inline-block; }
    .chat-cerrar {
      background: transparent; border: none; color: #fff;
      font-size: 26px; line-height: 1; cursor: pointer; opacity: .85;
    }
    .chat-cerrar:hover { opacity: 1; }

    /* ===== MENSAJES ===== */
    .chat-mensajes {
      flex: 1; overflow-y: auto; padding: 16px 14px; background: var(--fondo);
      display: flex; flex-direction: column; gap: 10px;
    }
    .msg { display: flex; align-items: flex-end; gap: 7px; max-width: 90%; }
    .msg.yo { align-self: flex-end; flex-direction: row-reverse; }
    .msg-avatar {
      width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%;
      background: var(--rojo-claro);
      display: flex; align-items: center; justify-content: center; font-size: 13px;
    }
    .burbuja {
      padding: 9px 12px 6px; border-radius: 14px 14px 14px 4px;
      background: #fff; border: 1px solid var(--borde);
      font-size: 13px; color: var(--texto);
    }
    .msg.yo .burbuja { border-radius: 14px 14px 4px 14px; border: none; background: var(--rojo); color: #fff; }
    .burbuja p { margin: 0; white-space: pre-line; line-height: 1.45; }
    .burbuja time { display: block; margin-top: 3px; font-size: 9.5px; text-align: right; opacity: .55; }

    .escribiendo { display: flex; gap: 4px; padding: 12px 14px; }
    .escribiendo span {
      width: 7px; height: 7px; border-radius: 50%; background: #b9b6ae;
      animation: rebote 1.2s infinite;
    }
    .escribiendo span:nth-child(2) { animation-delay: .15s; }
    .escribiendo span:nth-child(3) { animation-delay: .3s; }

    /* ===== SUGERENCIAS ===== */
    .sugerencias {
      display: flex; gap: 6px; overflow-x: auto;
      padding: 8px 12px; background: #fff; border-top: 1px solid var(--borde);
      scrollbar-width: none;
    }
    .sugerencias::-webkit-scrollbar { display: none; }
    .chip {
      flex-shrink: 0; padding: 6px 11px; border-radius: 999px;
      border: 1px solid #f2c9d0; background: var(--rojo-claro); color: var(--rojo-oscuro);
      font-size: 11.5px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: .15s;
    }
    .chip:hover:not(:disabled) { background: var(--rojo); color: #fff; border-color: var(--rojo); }
    .chip:disabled { opacity: .5; cursor: not-allowed; }

    /* ===== ENTRADA ===== */
    .chat-input { display: flex; gap: 8px; padding: 10px 12px 12px; background: #fff; }
    .chat-input input {
      flex: 1; min-width: 0; height: 42px; padding: 0 14px;
      border: 1px solid var(--borde); border-radius: 12px; background: var(--fondo);
      font-size: 13px; color: var(--texto); outline: none;
    }
    .chat-input input:focus { border-color: var(--rojo); background: #fff; }
    .btn-enviar {
      width: 42px; height: 42px; flex-shrink: 0; border: none; border-radius: 12px;
      background: var(--rojo); color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: .2s;
    }
    .btn-enviar:hover:not(:disabled) { background: var(--rojo-oscuro); }
    .btn-enviar:disabled { background: #cfcac2; cursor: not-allowed; }

    @keyframes abrir { from { opacity: 0; transform: scale(.92) translateY(10px); } to { opacity: 1; transform: none; } }
    @keyframes rebote { 0%, 60%, 100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-5px); opacity: 1; } }

    @media (max-width: 480px) {
      .chat { right: 8px; left: 8px; bottom: 88px; width: auto; height: calc(100vh - 110px); }
      .fab { right: 16px; bottom: 16px; }
    }
  `]
})
export class ChatAsistenteComponent implements OnInit {

  @ViewChild('lista') lista?: ElementRef<HTMLDivElement>;

  esAdmin = false;

  abierto = false;
  texto = '';
  escribiendo = false;
  noLeidos = 1;
  mensajes: Mensaje[] = [];

  // Datos del DOCENTE
  private misClases: any[] = [];
  private misCargas: any[] = [];
  private misHoras = 0;

  // Datos del ADMINISTRADOR
  private docentes: any[] = [];
  private cursos: any[] = [];
  private asignaturas: any[] = [];
  private aulas: any[] = [];
  private cargas: any[] = [];

  private datos: Promise<void> | null = null;

  constructor(
    private authService: AuthService,
    private horarioService: HorarioService,
    private docenteService: DocenteService,
    private cursoService: CursoService,
    private asignaturaService: AsignaturaService,
    private aulaService: AulaService,
    private cargaService: CargaHorariaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.esAdmin = this.authService.getUsuario()?.rol === 'ADMINISTRADOR';
  }

  get sugerencias(): string[] {
    return this.esAdmin
      ? ['¿Qué docentes no tienen carga?', '¿Qué cursos no tienen materias?', '¿Quién tiene más horas?', 'Resumen del sistema', '¿A qué hora es el recreo?']
      : ['¿Qué clases tengo hoy?', '¿Y mañana?', '¿Cuántas horas tengo?', '¿A qué hora es el recreo?'];
  }

  toggle(): void {
    this.abierto = !this.abierto;
    if (!this.abierto) return;

    this.noLeidos = 0;
    this.datos = null; // al abrir, vuelve a consultar datos frescos

    if (this.mensajes.length === 0) {
      this.agregar('bot', this.esAdmin
        ? '¡Hola! 👋 Soy el asistente del sistema.\nPuedo decirte qué docentes o cursos no tienen carga, la carga de un docente, las materias de un curso, quién da una materia y el horario de la jornada.'
        : '¡Hola! 👋 Soy tu asistente de horarios.\nPregúntame por tus clases de un día, una materia, un curso, tus horas o el horario de la jornada.');
    }
    this.bajar();
  }

  async enviar(sugerencia?: string): Promise<void> {
    const pregunta = (sugerencia ?? this.texto).trim();
    if (!pregunta || this.escribiendo) return;

    this.agregar('yo', pregunta);
    this.texto = '';
    this.escribiendo = true;
    this.bajar();

    let respuesta: string;
    try {
      await Promise.all([this.asegurarDatos(), this.esperar(650)]);
      respuesta = this.responder(pregunta);
    } catch {
      this.datos = null;
      respuesta = 'No pude consultar los datos del sistema en este momento. Inténtalo de nuevo en unos segundos.';
    }

    this.escribiendo = false;
    this.agregar('bot', respuesta);
    this.cdr.detectChanges();
    this.bajar();
  }

  // ==========================================================
  // CARGA DE DATOS (según el rol)
  // ==========================================================
  private asegurarDatos(): Promise<void> {
    if (!this.datos) {
      this.datos = this.esAdmin ? this.cargarAdmin() : this.cargarDocente();
    }
    return this.datos;
  }

  private async cargarDocente(): Promise<void> {
    const res: any = await firstValueFrom(this.horarioService.misClases());
    const d = res?.data || {};
    this.misClases = d.clases || [];
    this.misCargas = d.cargas || [];
    this.misHoras = d.totalHoras || 0;
  }

  private async cargarAdmin(): Promise<void> {
    const r: any = await firstValueFrom(forkJoin({
      docentes: this.docenteService.getAll(),
      cursos: this.cursoService.getAll(),
      asignaturas: this.asignaturaService.getAll(),
      aulas: this.aulaService.getAll(),
      cargas: this.cargaService.getAll()
    }));
    this.docentes = r.docentes?.data || [];
    this.cursos = r.cursos?.data || [];
    this.asignaturas = r.asignaturas?.data || [];
    this.aulas = r.aulas?.data || [];
    this.cargas = r.cargas?.data || [];
  }

  // ==========================================================
  // RESPUESTAS (demo local; luego se reemplaza por el backend)
  // ==========================================================
  private responder(pregunta: string): string {
    const q = this.normalizar(pregunta);
    return this.respuestaComun(q) ?? (this.esAdmin ? this.responderAdmin(q) : this.responderDocente(q));
  }

  // ----- Para los dos roles -----
  private respuestaComun(q: string): string | null {
    if (/^(hola|buen|saludos|hey)/.test(q)) {
      return '¡Hola! ¿En qué te ayudo? Toca una de las sugerencias o escríbeme tu pregunta.';
    }
    if (q.includes('gracias')) {
      return '¡Con gusto! Si necesitas algo más, aquí estoy. 😊';
    }
    if (/(ayuda|que puedes|que sabes|que haces)/.test(q)) {
      return this.esAdmin
        ? 'Puedo ayudarte con:\n• Docentes sin carga horaria\n• Cursos sin materias\n• La carga de un docente (ej: "carga de Lorena Erazo")\n• Materias de un curso (ej: "materias de 8vo A")\n• Quién da una materia (ej: "quién da Inglés")\n• Quién tiene más horas\n• Resumen del sistema\n• Horario de la jornada y recreos'
        : 'Puedo ayudarte con:\n• Tus clases de un día (ej: "clases del jueves")\n• Tus clases de hoy o mañana\n• Cuándo das una materia\n• Tus clases en un curso (ej: "clases en 8vo")\n• Tus horas semanales\n• Horario de la jornada y recreos';
    }
    if (/(recreo|receso|salida|hora de entrada|jornada|a que hora (salen|entran|terminan))/.test(q)) {
      return JORNADA;
    }
    return null;
  }

  // ----- DOCENTE: solo sus datos -----
  private responderDocente(q: string): string {
    if (this.misClases.length === 0 && this.misCargas.length === 0) {
      return 'Todavía no tienes clases ni carga horaria registradas. Cuando la coordinación publique el horario podré ayudarte. 🙂';
    }

    if (/(cuantas horas|mis horas|mi carga|cuantas materias)/.test(q)) {
      const lineas = this.misCargas.map(c => `• ${c.asignatura} · ${c.curso} → ${c.horas_semanales} h`);
      return `Tienes ${this.misHoras} horas semanales en ${this.plural(this.misCargas.length, 'materia', 'materias')}:\n${lineas.join('\n')}`;
    }

    const dia = this.detectarDia(q);
    if (dia?.finDeSemana) return `${dia.prefijo} es fin de semana, no tienes clases. 🎉`;

    const materia = this.detectarMateria(q, this.misClases.map(c => c.asignatura));
    const curso = this.detectarCurso(q);

    if (!dia && !materia && !curso) return this.noEntendi();

    let lista = this.misClases;
    if (dia) lista = lista.filter(c => c.dia === dia.clave);
    if (materia) lista = lista.filter(c => this.normalizar(c.asignatura) === this.normalizar(materia));
    if (curso) {
      const buscado = curso.paralelo ? `${curso.grado} ${curso.paralelo}` : curso.grado;
      lista = lista.filter(c => this.normalizar(c.curso).startsWith(buscado));
    }

    const quePide = [materia || '', curso ? `en ${curso.texto}` : ''].filter(Boolean).join(' ');

    if (lista.length === 0) {
      return dia
        ? `${dia.prefijo} no tienes ${quePide ? 'clases de ' + quePide : 'clases'}. 🎉`
        : `No encontré clases de ${quePide} en tu horario.`;
    }

    lista = [...lista].sort((a, b) =>
      (this.ordenDia(a.dia) - this.ordenDia(b.dia)) || a.hora_inicio.localeCompare(b.hora_inicio));

    if (dia && /(primera|empiez|entro|inicio)/.test(q)) {
      const c = lista[0];
      return `${dia.prefijo} tu primera clase es a las ${c.hora_inicio}: ${c.asignatura} con ${c.curso}${c.aula ? ' en ' + c.aula : ''}.`;
    }

    const lineas = lista.map(c =>
      `• ${dia ? '' : this.labelDia(c.dia) + ' '}${c.hora_inicio}–${c.hora_fin}  ${c.asignatura} · ${c.curso}${c.aula ? ' · ' + c.aula : ''}`);

    const cuantas = this.plural(lista.length, 'clase', 'clases');
    const encabezado = dia
      ? `${dia.prefijo} tienes ${cuantas}${quePide ? ' de ' + quePide : ''}:`
      : `Tienes ${cuantas} de ${quePide} por semana:`;

    return `${encabezado}\n${lineas.join('\n')}`;
  }

  // ----- ADMINISTRADOR: datos de todo el sistema -----
  private responderAdmin(q: string): string {
    const horasPorDocente = new Map<number, number>();
    const cursosConCarga = new Set<number>();
    for (const c of this.cargas) {
      const id = Number(c.docente_id ?? c.docente?.id);
      horasPorDocente.set(id, (horasPorDocente.get(id) || 0) + Number(c.horas_semanales || 0));
      cursosConCarga.add(Number(c.curso_id ?? c.curso?.id));
    }
    const docentesSinCarga = this.docentes.filter(d => !horasPorDocente.has(Number(d.id)));
    const cursosSinMaterias = this.cursos.filter(c => !cursosConCarga.has(Number(c.id)));

    // Cursos sin materias
    if (/(sin materias|no tienen materias|cursos sin)/.test(q)) {
      if (cursosSinMaterias.length === 0) return 'Todos los cursos tienen al menos una materia asignada. ✅';
      return `Hay ${this.plural(cursosSinMaterias.length, 'curso', 'cursos')} sin materias asignadas:\n` +
        this.listar(cursosSinMaterias.map(c => `• ${this.nombreCurso(c)} · ${c.nivel}`));
    }

    // Docentes sin carga
    if (/(sin carga|no tienen carga|no tiene carga)/.test(q)) {
      if (docentesSinCarga.length === 0) return 'Todos los docentes tienen carga horaria asignada. ✅';
      return `Hay ${this.plural(docentesSinCarga.length, 'docente', 'docentes')} sin carga horaria:\n` +
        this.listar(docentesSinCarga.map(d => `• ${this.nombreDocente(d)}`));
    }

    // Quién tiene más horas
    if (/(mas horas|mayor carga|mas carga)/.test(q)) {
      const top = this.docentes
        .filter(d => horasPorDocente.has(Number(d.id)))
        .sort((a, b) => horasPorDocente.get(Number(b.id))! - horasPorDocente.get(Number(a.id))!)
        .slice(0, 5);
      if (top.length === 0) return 'Todavía no hay cargas horarias registradas.';
      return 'Docentes con más horas semanales:\n' +
        top.map((d, i) => `${i + 1}. ${this.nombreDocente(d)} → ${horasPorDocente.get(Number(d.id))} h`).join('\n');
    }

    // Conteos
    if (/cuant/.test(q)) {
      if (/(docente|profesor)/.test(q)) {
        return `Hay ${this.plural(this.docentes.length, 'docente registrado', 'docentes registrados')} (${docentesSinCarga.length} sin carga horaria).`;
      }
      if (q.includes('curso')) {
        return `Hay ${this.plural(this.cursos.length, 'curso', 'cursos')} (${cursosSinMaterias.length} sin materias asignadas).`;
      }
      if (/(asignatura|materia)/.test(q)) {
        return `Hay ${this.plural(this.asignaturas.length, 'asignatura registrada', 'asignaturas registradas')}.`;
      }
      if (q.includes('aula')) {
        return `Hay ${this.plural(this.aulas.length, 'aula registrada', 'aulas registradas')}.`;
      }
      if (q.includes('carga')) {
        return `Hay ${this.plural(this.cargas.length, 'carga horaria', 'cargas horarias')} (${this.totalHorasSistema()} h semanales en total).`;
      }
      return this.resumen(docentesSinCarga.length, cursosSinMaterias.length);
    }

    if (/(resumen|estado|como va|como esta)/.test(q)) {
      return this.resumen(docentesSinCarga.length, cursosSinMaterias.length);
    }

    // Carga de un docente (por nombre)
    const candidatos = this.detectarDocentes(q);
    if (candidatos.length > 1) {
      return 'Encontré varios docentes con ese nombre:\n' +
        candidatos.map(d => `• ${this.nombreDocente(d)}`).join('\n') + '\n¿A cuál te refieres? Escribe nombre y apellido.';
    }
    if (candidatos.length === 1) {
      const d = candidatos[0];
      const suyas = this.cargas.filter(c => Number(c.docente_id ?? c.docente?.id) === Number(d.id));
      if (suyas.length === 0) return `${this.nombreDocente(d)} todavía no tiene carga horaria asignada.`;
      const total = suyas.reduce((s, c) => s + Number(c.horas_semanales || 0), 0);
      return `${this.nombreDocente(d)} tiene ${total} h semanales en ${this.plural(suyas.length, 'materia', 'materias')}:\n` +
        suyas.map(c => `• ${c.asignatura?.nombre} · ${this.nombreCurso(c.curso)} → ${c.horas_semanales} h`).join('\n');
    }

    // Materias de un curso
    const curso = this.detectarCurso(q);
    if (curso) {
      const encontrados = this.cursos.filter(c =>
        this.normalizar(c.grado) === curso.grado && (!curso.paralelo || this.normalizar(c.paralelo) === curso.paralelo));
      if (encontrados.length === 0) return `No encontré el curso ${curso.texto}.`;

      const ids = new Set(encontrados.map(c => Number(c.id)));
      const delCurso = this.cargas.filter(c => ids.has(Number(c.curso_id ?? c.curso?.id)));
      const etiqueta = curso.paralelo ? curso.texto : `${curso.texto} (todos los paralelos)`;

      if (delCurso.length === 0) return `${etiqueta} todavía no tiene materias asignadas.`;
      return `Materias de ${etiqueta}:\n` + this.listar(delCurso.map(c =>
        `• ${c.asignatura?.nombre}${curso.paralelo ? '' : ' · ' + this.nombreCurso(c.curso)} → ${this.nombreDocente(c.docente)} (${c.horas_semanales} h)`), 15);
    }

    // Quién da una materia
    const materia = this.detectarMateria(q, this.asignaturas.map(a => a.nombre));
    if (materia) {
      const deMateria = this.cargas.filter(c => this.normalizar(c.asignatura?.nombre) === this.normalizar(materia));
      if (deMateria.length === 0) return `Nadie tiene asignada ${materia} todavía.`;
      return `${materia} la dan:\n` + this.listar(deMateria.map(c =>
        `• ${this.nombreCurso(c.curso)} → ${this.nombreDocente(c.docente)} (${c.horas_semanales} h)`), 15);
    }

    return this.noEntendi();
  }

  private resumen(sinCarga: number, sinMaterias: number): string {
    return 'Resumen del sistema:\n' +
      `• Docentes: ${this.docentes.length} (${sinCarga} sin carga)\n` +
      `• Cursos: ${this.cursos.length} (${sinMaterias} sin materias)\n` +
      `• Asignaturas: ${this.asignaturas.length}\n` +
      `• Aulas: ${this.aulas.length}\n` +
      `• Cargas horarias: ${this.cargas.length} (${this.totalHorasSistema()} h semanales)`;
  }

  private noEntendi(): string {
    return this.esAdmin
      ? 'No entendí bien tu pregunta 🤔. Prueba, por ejemplo:\n• ¿Qué docentes no tienen carga?\n• Carga de Lorena Erazo\n• Materias de 8vo A\n• ¿Quién da Inglés?'
      : 'No entendí bien tu pregunta 🤔. Prueba, por ejemplo:\n• ¿Qué clases tengo el jueves?\n• ¿Cuándo tengo Matemáticas?\n• ¿Cuántas horas tengo?';
  }

  // ==========================================================
  // DETECTORES
  // ==========================================================
  private detectarDia(q: string): { clave: string; prefijo: string; finDeSemana?: boolean } | null {
    const hoy = new Date().getDay(); // 0 domingo ... 6 sábado
    let indice: number | null = null;
    let prefijo = '';

    if (q.includes('pasado manana')) { indice = (hoy + 2) % 7; prefijo = 'Pasado mañana'; }
    else if (q.includes('manana')) { indice = (hoy + 1) % 7; prefijo = 'Mañana'; }
    else if (q.includes('hoy')) { indice = hoy; prefijo = 'Hoy'; }

    if (indice !== null) {
      if (indice === 0 || indice === 6) return { clave: '', prefijo, finDeSemana: true };
      const d = DIAS[indice - 1];
      return { clave: d.clave, prefijo: `${prefijo} (${d.label})` };
    }

    const encontrado = DIAS.find(d => q.includes(this.normalizar(d.label)));
    if (encontrado) return { clave: encontrado.clave, prefijo: `El ${encontrado.label}` };

    if (q.includes('sabado') || q.includes('domingo')) {
      return { clave: '', prefijo: 'Ese día', finDeSemana: true };
    }
    return null;
  }

  // Ej: "8vo", "8vo a", "1ro bgu b", "inicial"
  private detectarCurso(q: string): { grado: string; paralelo: string | null; texto: string } | null {
    const m = q.match(/\b(inicial|\d{1,2}(?:ro|do|to|vo|no|mo))(\s+bgu)?(?:\s+([a-d]))?(?=\s|$)/);
    if (!m) return null;
    const grado = m[1] + (m[2] ? ' bgu' : '');
    const paralelo = m[3] || null;
    const texto = `${grado.replace('bgu', 'BGU')}${paralelo ? ' ' + paralelo.toUpperCase() : ''}`;
    return { grado, paralelo, texto };
  }

  // Devuelve el nombre original de la materia mencionada (acepta singular/plural)
  private detectarMateria(q: string, nombres: string[]): string | null {
    const unicos = [...new Set(nombres.filter(Boolean))]
      .sort((a, b) => b.length - a.length); // primero las más largas
    return unicos.find(n => {
      const raiz = this.normalizar(n).replace(/s$/, '');
      return raiz.length >= 3 && q.includes(raiz);
    }) || null;
  }

  // Busca docentes cuyo nombre o apellido aparezca en la pregunta
  private detectarDocentes(q: string): any[] {
    const palabras = new Set(q.split(' '));
    let mejor = 0;
    let candidatos: any[] = [];

    for (const d of this.docentes) {
      const partes = this.normalizar(`${d.nombres} ${d.apellidos}`).split(' ')
        .filter(p => p.length >= 3 && !NO_NOMBRES.has(p));
      const puntos = partes.filter(p => palabras.has(p)).length;

      if (puntos > mejor) { mejor = puntos; candidatos = [d]; }
      else if (puntos === mejor && puntos > 0) { candidatos.push(d); }
    }
    return candidatos;
  }

  // ==========================================================
  // UTILIDADES
  // ==========================================================
  private totalHorasSistema(): number {
    return this.cargas.reduce((s, c) => s + Number(c.horas_semanales || 0), 0);
  }

  private nombreDocente(d: any): string {
    return d ? `${d.nombres || ''} ${d.apellidos || ''}`.trim() : 'Sin docente';
  }

  private nombreCurso(c: any): string {
    return c ? `${c.grado} "${c.paralelo}"` : '';
  }

  private listar(lineas: string[], max = 10): string {
    const visibles = lineas.slice(0, max).join('\n');
    return lineas.length > max ? `${visibles}\n…y ${lineas.length - max} más` : visibles;
  }

  private plural(n: number, singular: string, plural: string): string {
    return `${n} ${n === 1 ? singular : plural}`;
  }

  private labelDia(clave: string): string {
    const d = DIAS.find(x => x.clave === clave);
    return d ? d.label.charAt(0).toUpperCase() + d.label.slice(1) : clave;
  }

  private ordenDia(clave: string): number {
    return DIAS.findIndex(d => d.clave === clave);
  }

  private normalizar(texto: any): string {
    return (texto ?? '').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿?¡!.,"()]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private esperar(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  private agregar(de: 'bot' | 'yo', texto: string): void {
    const hora = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    this.mensajes.push({ de, texto, hora });
  }

  private bajar(): void {
    setTimeout(() => {
      const el = this.lista?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}