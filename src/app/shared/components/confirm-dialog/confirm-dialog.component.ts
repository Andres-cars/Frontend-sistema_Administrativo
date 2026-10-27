// src/app/shared/confirm-dialog/confirm-dialog.component.ts
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cd-overlay" (click)="onFondo()">
      <div class="cd-panel" role="alertdialog" aria-modal="true" (click)="$event.stopPropagation()">

        <div class="cd-icono">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/><path d="M8 6V4h8v2"/>
            <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
          </svg>
        </div>

        <h3 class="cd-titulo">{{ titulo }}</h3>

        <p class="cd-texto">
          @if (nombre) {
            Vas a eliminar <strong>"{{ nombre }}"</strong>.
          }
          {{ mensaje }}
        </p>

        <div class="cd-botones">
          <button type="button" class="cd-btn cd-cancelar"
                  [disabled]="cargando" (click)="cancelar.emit()">
            ✕ Cancelar
          </button>

          <button type="button" class="cd-btn cd-eliminar"
                  [disabled]="cargando" (click)="confirmar.emit()">
            @if (cargando) {
              <span class="cd-spinner"></span> Eliminando...
            } @else {
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                   stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>
              </svg>
              {{ textoConfirmar }}
            }
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .cd-overlay {
      position: fixed;
      inset: 0;
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(15, 23, 42, .55);
      backdrop-filter: blur(3px);
      animation: cdFade .18s ease;
    }

    .cd-panel {
      width: 100%;
      max-width: 400px;
      padding: 28px 24px 22px;
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, .25);
      text-align: center;
      font-family: 'Inter', 'IBM Plex Sans', Arial, sans-serif;
      animation: cdPop .22s ease;
    }

    .cd-icono {
      width: 60px;
      height: 60px;
      margin: 0 auto 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #fdecee;
      color: #c8102e;
    }

    .cd-titulo {
      margin: 0 0 8px;
      font-size: 19px;
      font-weight: 700;
      color: #17181c;
    }

    .cd-texto {
      margin: 0 0 22px;
      font-size: 13px;
      line-height: 1.55;
      color: #6b6d75;
    }
    .cd-texto strong { color: #17181c; }

    .cd-botones {
      display: flex;
      gap: 10px;
    }

    .cd-btn {
      flex: 1;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: .18s;
    }
    .cd-btn:disabled { opacity: .7; cursor: not-allowed; }

    .cd-cancelar {
      background: #e8ebf0;
      color: #2b2f38;
    }
    .cd-cancelar:hover:not(:disabled) { background: #dde1e8; }

    .cd-eliminar {
      background: linear-gradient(135deg, #a3001a, #e0122f);
      color: #fff;
      box-shadow: 0 6px 16px rgba(200, 16, 46, .28);
    }
    .cd-eliminar:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 10px 22px rgba(200, 16, 46, .35);
    }

    .cd-spinner {
      width: 15px;
      height: 15px;
      border: 2px solid rgba(255, 255, 255, .45);
      border-top-color: #fff;
      border-radius: 50%;
      animation: cdGiro .7s linear infinite;
    }

    @keyframes cdFade { from { opacity: 0 } to { opacity: 1 } }
    @keyframes cdPop  { from { opacity: 0; transform: scale(.94) translateY(8px) } to { opacity: 1; transform: none } }
    @keyframes cdGiro { to { transform: rotate(360deg) } }

    @media (max-width: 420px) {
      .cd-botones { flex-direction: column-reverse; }
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() titulo = '¿Eliminar este registro?';
  @Input() nombre = '';
  @Input() mensaje = 'Esta acción no se puede deshacer.';
  @Input() textoConfirmar = 'Sí, eliminar';
  @Input() cargando = false;

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  // Esc cierra el diálogo
  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (!this.cargando) this.cancelar.emit();
  }

  // Clic en el fondo oscuro cierra el diálogo
  onFondo(): void {
    if (!this.cargando) this.cancelar.emit();
  }
}