// shared/password-dialog/password-dialog.component.ts
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pd-overlay" (click)="onFondo()">
      <div class="pd-panel" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">

        @if (!resultado) {
          <!-- ===== FORMULARIO ===== -->
          <div class="pd-icono">🔑</div>
          <h3>{{ usuarioActual ? 'Restablecer contraseña' : 'Crear acceso al sistema' }}</h3>
          <p class="pd-sub">{{ docente }}</p>

          @if (error || errorLocal) {
            <div class="pd-error">⚠️ {{ error || errorLocal }}</div>
          }

          <form (ngSubmit)="enviar()">
            <label>Usuario</label>
            @if (usuarioActual) {
              <input class="pd-input" [value]="usuarioActual" readonly>
            } @else {
              <input class="pd-input" name="usuario" [(ngModel)]="usuario"
                     placeholder="Ej: maria@wei.edu.ec" autocomplete="off">
            }

            <label>Nueva contraseña</label>
            <div class="pd-pass">
              <input class="pd-input" [type]="ver ? 'text' : 'password'" name="password"
                     [(ngModel)]="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password">
              <button type="button" class="pd-mini" (click)="ver = !ver" [title]="ver ? 'Ocultar' : 'Mostrar'">
                {{ ver ? '🙈' : '👁️' }}
              </button>
              <button type="button" class="pd-mini" (click)="generar()" title="Generar contraseña segura">🎲</button>
            </div>
            <small class="pd-ayuda">Usa 🎲 para generar una clave segura. El docente podrá cambiarla después desde su portal.</small>

            <div class="pd-botones">
              <button type="button" class="pd-btn pd-cancelar" [disabled]="cargando" (click)="cancelar.emit()">Cancelar</button>
              <button type="submit" class="pd-btn pd-guardar" [disabled]="cargando">
                @if (cargando) {
                  <span class="pd-spinner"></span> Guardando...
                } @else {
                  {{ usuarioActual ? 'Restablecer' : 'Crear acceso' }}
                }
              </button>
            </div>
          </form>

        } @else {
          <!-- ===== RESULTADO: datos para entregar al docente ===== -->
          <div class="pd-icono ok">✓</div>
                    <h3>{{ resultado.mensaje || '¡Listo!' }}</h3>
          <p class="pd-sub">Entrega estos datos a {{ docente }}:</p>

          <div class="pd-credenciales">
            <div><span>Usuario</span><strong>{{ resultado.usuario }}</strong></div>
            <div><span>Contraseña</span><strong>{{ resultado.password }}</strong></div>
          </div>

          <button type="button" class="pd-btn pd-copiar" (click)="copiar()">
            {{ copiado ? '✓ Copiado' : '📋 Copiar datos' }}
          </button>
          <small class="pd-ayuda centro">Por seguridad, esta contraseña no se volverá a mostrar.</small>

          <div class="pd-botones">
            <button type="button" class="pd-btn pd-guardar" (click)="cancelar.emit()">Cerrar</button>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .pd-overlay {
      position: fixed; inset: 0; z-index: 10001;
      display: flex; align-items: center; justify-content: center; padding: 16px;
      background: rgba(15, 23, 42, .55); backdrop-filter: blur(3px);
      animation: pdFade .18s ease;
    }
    .pd-panel {
      width: 100%; max-width: 420px; padding: 26px 24px 22px;
      background: #fff; border-radius: 18px; box-shadow: 0 24px 60px rgba(0, 0, 0, .25);
      font-family: 'Inter', 'IBM Plex Sans', Arial, sans-serif;
      animation: pdPop .22s ease;
    }
    .pd-icono {
      width: 58px; height: 58px; margin: 0 auto 12px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: #fef3e2; font-size: 26px;
    }
    .pd-icono.ok { background: #e8f5e9; color: #2e7d32; font-size: 28px; font-weight: 800; }
    h3 { margin: 0; text-align: center; font-size: 19px; color: #17181c; }
    .pd-sub { margin: 4px 0 18px; text-align: center; font-size: 13px; color: #6b6d75; }

    .pd-error {
      margin-bottom: 14px; padding: 10px 12px; border-radius: 10px;
      background: #fdecee; color: #8a1f2d; border: 1px solid #f3c7cd; font-size: 12.5px;
    }

    label { display: block; margin: 0 0 6px; font-size: 12.5px; font-weight: 600; color: #17181c; }
    .pd-input {
      width: 100%; height: 42px; padding: 0 12px; margin-bottom: 14px; box-sizing: border-box;
      border: 1px solid #e5e2db; border-radius: 10px; background: #f7f6f3;
      font-size: 14px; color: #17181c; outline: none;
    }
    .pd-input:focus { border-color: #a91b2e; background: #fff; }
    .pd-input[readonly] { background: #edebe3; color: #6b6d75; cursor: not-allowed; }

    .pd-pass { display: flex; gap: 6px; }
    .pd-pass .pd-input { flex: 1; margin-bottom: 0; }
    .pd-mini {
      width: 42px; height: 42px; flex-shrink: 0; border: 1px solid #e5e2db; border-radius: 10px;
      background: #fff; cursor: pointer; font-size: 16px;
    }
    .pd-mini:hover { border-color: #a91b2e; }

    .pd-ayuda { display: block; margin: 7px 0 0; font-size: 11.5px; color: #9698a0; }
    .pd-ayuda.centro { text-align: center; margin-top: 8px; }

    .pd-credenciales {
      padding: 4px 14px; margin-bottom: 12px; border-radius: 12px;
      background: #f7f6f3; border: 1px dashed #d8d4ca;
    }
    .pd-credenciales div {
      display: flex; justify-content: space-between; gap: 10px; padding: 10px 0;
      font-size: 13px;
    }
    .pd-credenciales div + div { border-top: 1px solid #ebe8e1; }
    .pd-credenciales span { color: #6b6d75; }
    .pd-credenciales strong { color: #17181c; font-family: 'Consolas', 'Courier New', monospace; word-break: break-all; text-align: right; }

    .pd-botones { display: flex; gap: 10px; margin-top: 20px; }
    .pd-btn {
      flex: 1; height: 42px; display: flex; align-items: center; justify-content: center; gap: 7px;
      border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: .18s;
    }
    .pd-btn:disabled { opacity: .7; cursor: not-allowed; }
    .pd-cancelar { background: #e8ebf0; color: #2b2f38; }
    .pd-guardar { background: linear-gradient(135deg, #6e0f1e, #a91b2e); color: #fff; }
    .pd-copiar { width: 100%; background: #fff; color: #17181c; border: 1px solid #e5e2db; }
    .pd-copiar:hover { border-color: #a91b2e; }

    .pd-spinner {
      width: 15px; height: 15px; border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, .45); border-top-color: #fff;
      animation: pdGiro .7s linear infinite;
    }
    @keyframes pdFade { from { opacity: 0 } to { opacity: 1 } }
    @keyframes pdPop { from { opacity: 0; transform: scale(.94) translateY(8px) } to { opacity: 1; transform: none } }
    @keyframes pdGiro { to { transform: rotate(360deg) } }
  `]
})
export class PasswordDialogComponent {
  @Input() docente = '';
  @Input() usuarioActual: string | null = null;
  @Input() cargando = false;
  @Input() error = '';
    @Input() resultado: { usuario: string; password: string; mensaje?: string } | null = null;

  @Output() guardar = new EventEmitter<{ usuario: string; password: string }>();
  @Output() cancelar = new EventEmitter<void>();

  usuario = '';
  password = '';
  ver = false;
  copiado = false;
  errorLocal = '';

  enviar(): void {
    this.errorLocal = '';
    if (!this.usuarioActual && !this.usuario.trim()) {
      this.errorLocal = 'Escribe un nombre de usuario';
      return;
    }
    if (this.password.length < 6) {
      this.errorLocal = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    this.guardar.emit({ usuario: this.usuarioActual || this.usuario.trim(), password: this.password });
  }

  // Clave aleatoria de 10 caracteres, sin letras confusas (0/O, 1/l/I)
  generar(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const valores = new Uint32Array(10);
    crypto.getRandomValues(valores);
    this.password = Array.from(valores, v => chars[v % chars.length]).join('');
    this.ver = true;
  }

  copiar(): void {
    if (!this.resultado) return;
    const texto = `Usuario: ${this.resultado.usuario}\nContraseña: ${this.resultado.password}`;
    navigator.clipboard?.writeText(texto).then(() => (this.copiado = true));
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (!this.cargando) this.cancelar.emit();
  }

  onFondo(): void {
    // Con el resultado en pantalla no se cierra por accidente: solo con "Cerrar"
    if (!this.cargando && !this.resultado) this.cancelar.emit();
  }
}