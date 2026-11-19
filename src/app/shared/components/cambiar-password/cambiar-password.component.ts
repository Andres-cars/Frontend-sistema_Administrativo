// shared/components/cambiar-password/cambiar-password.component.ts
import { Component, EventEmitter, HostListener, Output, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cp-overlay" (click)="onFondo()">
      <div class="cp-panel" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">

        @if (!exito) {
          <!-- ===== FORMULARIO ===== -->
          <div class="cp-icono">🔒</div>
          <h3>Cambiar mi contraseña</h3>
          <p class="cp-sub">Por seguridad, primero escribe tu contraseña actual.</p>

          @if (error) {
            <div class="cp-error">⚠️ {{ error }}</div>
          }

          <form (ngSubmit)="guardar()">
            <label>Contraseña actual</label>
            <div class="cp-pass">
              <input class="cp-input" [type]="ver ? 'text' : 'password'" name="actual"
                     [(ngModel)]="actual" autocomplete="current-password" placeholder="Tu contraseña actual">
            </div>

            <label>Nueva contraseña</label>
            <div class="cp-pass">
              <input class="cp-input" [type]="ver ? 'text' : 'password'" name="nueva"
                     [(ngModel)]="nueva" autocomplete="new-password" placeholder="Mínimo 8 caracteres">
            </div>

            <!-- Indicador de seguridad -->
            @if (nueva) {
              <div class="cp-fuerza">
                <div class="cp-barra"><span [style.width.%]="fuerza.porcentaje" [style.background]="fuerza.color"></span></div>
                <small [style.color]="fuerza.color">{{ fuerza.texto }}</small>
              </div>
            }

            <label>Confirmar nueva contraseña</label>
            <div class="cp-pass">
              <input class="cp-input" [type]="ver ? 'text' : 'password'" name="confirmar"
                     [(ngModel)]="confirmar" autocomplete="new-password" placeholder="Repite la nueva contraseña"
                     [class.cp-mal]="confirmar && confirmar !== nueva">
            </div>
            @if (confirmar && confirmar !== nueva) {
              <small class="cp-aviso">Las contraseñas no coinciden</small>
            }

            <label class="cp-check">
              <input type="checkbox" [(ngModel)]="ver" name="ver"> Mostrar contraseñas
            </label>

            <div class="cp-botones">
              <button type="button" class="cp-btn cp-cancelar" [disabled]="cargando" (click)="cerrado.emit()">Cancelar</button>
              <button type="submit" class="cp-btn cp-guardar" [disabled]="cargando">
                @if (cargando) {
                  <span class="cp-spinner"></span> Guardando...
                } @else {
                  Cambiar contraseña
                }
              </button>
            </div>
          </form>

        } @else {
          <!-- ===== ÉXITO ===== -->
          <div class="cp-icono ok">✓</div>
          <h3>¡Contraseña cambiada correctamente!</h3>
          <p class="cp-sub">La próxima vez que inicies sesión usa tu nueva contraseña.</p>
          <div class="cp-botones">
            <button type="button" class="cp-btn cp-guardar" (click)="cerrado.emit()">Entendido</button>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .cp-overlay {
      position: fixed; inset: 0; z-index: 10001;
      display: flex; align-items: center; justify-content: center; padding: 16px;
      background: rgba(15, 23, 42, .55); backdrop-filter: blur(3px);
      animation: cpFade .18s ease;
    }
    .cp-panel {
      width: 100%; max-width: 420px; padding: 26px 24px 22px;
      background: #fff; border-radius: 18px; box-shadow: 0 24px 60px rgba(0, 0, 0, .25);
      font-family: 'Inter', 'IBM Plex Sans', Arial, sans-serif;
      animation: cpPop .22s ease;
    }
    .cp-icono {
      width: 58px; height: 58px; margin: 0 auto 12px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: #fbeaec; font-size: 25px;
    }
    .cp-icono.ok { background: #e8f5e9; color: #2e7d32; font-size: 28px; font-weight: 800; }
    h3 { margin: 0; text-align: center; font-size: 19px; color: #17181c; }
    .cp-sub { margin: 5px 0 18px; text-align: center; font-size: 13px; color: #6b6d75; }

    .cp-error {
      margin-bottom: 14px; padding: 10px 12px; border-radius: 10px;
      background: #fdecee; color: #8a1f2d; border: 1px solid #f3c7cd; font-size: 12.5px;
    }

    label { display: block; margin: 0 0 6px; font-size: 12.5px; font-weight: 600; color: #17181c; }
    .cp-pass { margin-bottom: 14px; }
    .cp-input {
      width: 100%; height: 42px; padding: 0 12px; box-sizing: border-box;
      border: 1px solid #e5e2db; border-radius: 10px; background: #f7f6f3;
      font-size: 14px; color: #17181c; outline: none;
    }
    .cp-input:focus { border-color: #a91b2e; background: #fff; }
    .cp-input.cp-mal { border-color: #dc2626; }

    .cp-fuerza { margin: -6px 0 14px; display: flex; align-items: center; gap: 10px; }
    .cp-barra { flex: 1; height: 6px; border-radius: 999px; background: #efede8; overflow: hidden; }
    .cp-barra span { display: block; height: 100%; border-radius: 999px; transition: width .25s, background .25s; }
    .cp-fuerza small { font-size: 11.5px; font-weight: 600; white-space: nowrap; }

    .cp-aviso { display: block; margin: -8px 0 12px; font-size: 11.5px; color: #dc2626; }

    .cp-check {
      display: flex; align-items: center; gap: 7px; margin-top: 2px;
      font-weight: 500; color: #6b6d75; cursor: pointer;
    }
    .cp-check input { accent-color: #a91b2e; }

    .cp-botones { display: flex; gap: 10px; margin-top: 20px; }
    .cp-btn {
      flex: 1; height: 42px; display: flex; align-items: center; justify-content: center; gap: 7px;
      border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: .18s;
    }
    .cp-btn:disabled { opacity: .7; cursor: not-allowed; }
    .cp-cancelar { background: #e8ebf0; color: #2b2f38; }
    .cp-guardar { background: linear-gradient(135deg, #6e0f1e, #a91b2e); color: #fff; }

    .cp-spinner {
      width: 15px; height: 15px; border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, .45); border-top-color: #fff;
      animation: cpGiro .7s linear infinite;
    }
    @keyframes cpFade { from { opacity: 0 } to { opacity: 1 } }
    @keyframes cpPop { from { opacity: 0; transform: scale(.94) translateY(8px) } to { opacity: 1; transform: none } }
    @keyframes cpGiro { to { transform: rotate(360deg) } }
  `]
})
export class CambiarPasswordComponent {
  @Output() cerrado = new EventEmitter<void>();

  actual = '';
  nueva = '';
  confirmar = '';
  ver = false;

  cargando = false;
  error = '';
  exito = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  // Indicador simple de seguridad de la contraseña
  get fuerza(): { porcentaje: number; color: string; texto: string } {
    const p = this.nueva;
    let puntos = 0;
    if (p.length >= 6) puntos++;
    if (p.length >= 10) puntos++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) puntos++;
    if (/\d/.test(p)) puntos++;
    if (/[^A-Za-z0-9]/.test(p)) puntos++;

    if (p.length < 8) return { porcentaje: 15, color: '#dc2626', texto: 'Muy corta' };
    if (puntos <= 2) return { porcentaje: 40, color: '#ea8c1a', texto: 'Débil' };
    if (puntos <= 3) return { porcentaje: 70, color: '#ca8a04', texto: 'Aceptable' };
    return { porcentaje: 100, color: '#16a34a', texto: 'Segura' };
  }

  guardar(): void {
    if (this.cargando) return;
    this.error = '';

    if (!this.actual || !this.nueva || !this.confirmar) {
      this.error = 'Completa los tres campos';
      return;
    }
    if (this.nueva.length < 8) {
      this.error = 'La nueva contraseña debe tener al menos 8 caracteres';
      return;
    }
    if (this.nueva !== this.confirmar) {
      this.error = 'La confirmación no coincide con la nueva contraseña';
      return;
    }
    if (this.nueva === this.actual) {
      this.error = 'La nueva contraseña debe ser diferente a la actual';
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.authService.cambiarPassword(this.actual, this.nueva)
      .pipe(
        timeout(15000),
        finalize(() => this.zone.run(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        }))
      )
      .subscribe({
        next: () => this.zone.run(() => {
          this.exito = true;
          this.actual = this.nueva = this.confirmar = '';
          this.cdr.detectChanges();
        }),
        error: (err) => this.zone.run(() => {
          this.error = err?.name === 'TimeoutError'
            ? 'El servidor tardó demasiado en responder. Inténtalo de nuevo.'
            : (err?.error?.message || 'No se pudo cambiar la contraseña');
          this.cdr.detectChanges();
        })
      });
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (!this.cargando) this.cerrado.emit();
  }

  onFondo(): void {
    if (!this.cargando) this.cerrado.emit();
  }
}