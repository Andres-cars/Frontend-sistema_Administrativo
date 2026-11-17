// src/app/shared/chat-docente/chat-docente.component.ts
import { Component, ElementRef, Input, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

@Component({
  selector: 'app-chat-docente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Ventana del chat -->
    @if (abierto) {
      <section class="chat" role="dialog" aria-label="Asistente de horarios">

        <header class="chat-head">
          <div class="bot-avatar">🤖</div>
          <div class="chat-titulo">
            <strong>Asistente de horarios</strong>
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
      --texto-secundario: #6b6d75;
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
      transition: transform .2s, box-shadow .2s;
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
      width: 370px; height: 540px; max-height: calc(100vh - 120px);
      display: flex; flex-direction: column;
      background: #fff; border: 1px solid var(--borde); border-radius: 20px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, .18);
      overflow: hidden;
      animation: abrir .25s ease;
      transform-origin: bottom right;
    }

    .chat-head {
      display: flex; align-items: center; gap: 11px;
      padding: 14px 16px;
      background: linear-gradient(135deg, var(--rojo-oscuro), var(--rojo));
      color: #fff;
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
      flex: 1; overflow-y: auto;
      padding: 16px 14px; background: var(--fondo);
      display: flex; flex-direction: column; gap: 10px;
    }

    .msg { display: flex; align-items: flex-end; gap: 7px; max-width: 88%; }
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
    .msg.yo .burbuja {
      border-radius: 14px 14px 4px 14px; border: none;
      background: var(--rojo); color: #fff;
    }
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
      font-size: 11.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
      transition: .15s;
    }
    .chip:hover:not(:disabled) { background: var(--rojo); color: #fff; border-color: var(--rojo); }
    .chip:disabled { opacity: .5; cursor: not-allowed; }

    /* ===== ENTRADA ===== */
    .chat-input {
      display: flex; gap: 8px; padding: 10px 12px 12px; background: #fff;
    }
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

    /* ===== CELULAR ===== */
    @media (max-width: 480px) {
      .chat { right: 8px; left: 8px; bottom: 88px; width: auto; height: calc(100vh - 110px); }
      .fab { right: 16px; bottom: 16px; }
    }
  `]
})
export class ChatDocenteComponent {
  @Input() clases: any[] = [];
  @Input() cargas: any[] = [];
  @Input() nombre = '';
  @Input() totalHoras = 0;

  @ViewChild('lista') lista?: ElementRef<HTMLDivElement>;

  abierto = false;
  texto = '';
  escribiendo = false;
  noLeidos = 1;
  mensajes: Mensaje[] = [];

  sugerencias = [
    '¿Qué clases tengo hoy?',
    '¿Y mañana?',
    '¿A qué hora es mi clase del martes?',
    '¿Cuántas horas tengo?'
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  toggle(): void {
    this.abierto = !this.abierto;
    if (this.abierto) {
      this.noLeidos = 0;
      if (this.mensajes.length === 0) {
        const nombreCorto = (this.nombre || '').split(' ')[0];
        this.agregar('bot',
          `¡Hola${nombreCorto ? ', ' + nombreCorto : ''}! 👋 Soy tu asistente de horarios.\n` +
          `Pregúntame por tus clases de un día, una materia, un curso o tus horas semanales.`);
      }
      this.bajar();
    }
  }

  enviar(sugerencia?: string): void {
    const pregunta = (sugerencia ?? this.texto).trim();
    if (!pregunta || this.escribiendo) return;

    this.agregar('yo', pregunta);
    this.texto = '';
    this.escribiendo = true;
    this.bajar();

    // Simula que el asistente "piensa" un momento
    setTimeout(() => {
      this.escribiendo = false;
      this.agregar('bot', this.responder(pregunta));
      this.cdr.detectChanges();
      this.bajar();
    }, 700);
  }

  // ==========================================================
  // RESPUESTAS DE DEMOSTRACIÓN (se reemplazará por el backend)
  // ==========================================================
  private responder(pregunta: string): string {
    const q = this.normalizar(pregunta);

    if (this.clases.length === 0 && this.cargas.length === 0) {
      return 'Todavía no tienes clases ni carga horaria registradas. Cuando la coordinación publique el horario podré ayudarte. 🙂';
    }

    if (/^(hola|buen|saludos|hey)/.test(q)) {
      return '¡Hola! ¿En qué te ayudo? Por ejemplo: "¿qué clases tengo el martes?"';
    }
    if (q.includes('gracias')) {
      return '¡Con gusto! Si necesitas algo más, aquí estoy. 😊';
    }

    // Horas / carga
    if (/(cuantas horas|mis horas|carga|cuantas materias)/.test(q)) {
      const lineas = this.cargas.map(c => `• ${c.asignatura} · ${c.curso} → ${c.horas_semanales} h`);
      return `Tienes ${this.totalHoras} horas semanales en ${this.cargas.length} ` +
        `${this.cargas.length === 1 ? 'materia' : 'materias'}:\n${lineas.join('\n')}`;
    }

    const dia = this.detectarDia(q);
    const materia = this.detectarMateria(q);
    const curso = this.detectarCurso(q);

    // Fin de semana
    if (dia && dia.finDeSemana) {
      return `${dia.prefijo} es fin de semana, no tienes clases. 🎉`;
    }

    let lista = this.clases;
    if (dia) lista = lista.filter(c => c.dia === dia.clave);
    if (materia) lista = lista.filter(c => this.normalizar(c.asignatura) === materia);
    if (curso) lista = lista.filter(c => this.normalizar(c.curso).includes(curso));

    if (!dia && !materia && !curso) {
      return 'No entendí bien tu pregunta 🤔. Puedes preguntarme, por ejemplo:\n' +
        '• ¿Qué clases tengo el jueves?\n• ¿Cuándo tengo Matemáticas?\n• ¿Cuántas horas tengo?';
    }

    const quePide = [
      materia ? this.nombreMateria(materia) : '',
      curso ? `en ${curso}` : ''
    ].filter(Boolean).join(' ');

    if (lista.length === 0) {
      if (dia) return `${dia.prefijo} no tienes ${quePide ? 'clases de ' + quePide : 'clases'}. 🎉`;
      return `No encontré clases de ${quePide} en tu horario.`;
    }

    lista = [...lista].sort((a, b) =>
      (this.ordenDia(a.dia) - this.ordenDia(b.dia)) || a.hora_inicio.localeCompare(b.hora_inicio));

    // "¿A qué hora empiezo / mi primera clase...?"
    if (dia && /(primera|empiez|entro|inicio)/.test(q)) {
      const c = lista[0];
      return `${dia.prefijo} tu primera clase es a las ${c.hora_inicio}: ${c.asignatura} con ${c.curso}` +
        `${c.aula ? ' en ' + c.aula : ''}.`;
    }

    const lineas = lista.map(c =>
      `• ${dia ? '' : this.labelDia(c.dia) + ' '}${c.hora_inicio}–${c.hora_fin}  ` +
      `${c.asignatura} · ${c.curso}${c.aula ? ' · ' + c.aula : ''}`);

    const cuantas = `${lista.length} ${lista.length === 1 ? 'clase' : 'clases'}`;
    const encabezado = dia
      ? `${dia.prefijo} tienes ${cuantas}${quePide ? ' de ' + quePide : ''}:`
      : `Tienes ${cuantas} de ${quePide} por semana:`;

    return `${encabezado}\n${lineas.join('\n')}`;
  }

  // ===== Detectores =====
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
    if (encontrado) {
      const art = encontrado.clave === 'MIERCOLES' ? 'El' : 'El';
      return { clave: encontrado.clave, prefijo: `${art} ${encontrado.label}` };
    }

    if (q.includes('sabado') || q.includes('domingo')) {
      return { clave: '', prefijo: 'Ese día', finDeSemana: true };
    }
    return null;
  }

  private detectarMateria(q: string): string | null {
    const materias = [...new Set(this.clases.map(c => this.normalizar(c.asignatura)))];
    return materias.find(m => m && q.includes(m)) || null;
  }

  private detectarCurso(q: string): string | null {
    // Ej: "8vo", "10mo", "1ro bgu"
    const m = q.match(/\b(\d{1,2}(?:ro|do|to|vo|no|mo))\b/);
    return m ? m[1] : null;
  }

  // ===== Utilidades =====
  private nombreMateria(normalizada: string): string {
    const c = this.clases.find(x => this.normalizar(x.asignatura) === normalizada);
    return c ? c.asignatura : normalizada;
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
      .replace(/[¿?¡!.,"]/g, ' ').replace(/\s+/g, ' ').trim();
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