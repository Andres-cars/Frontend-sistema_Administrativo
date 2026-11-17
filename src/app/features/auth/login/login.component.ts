// src/app/features/auth/login/login.component.ts
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { timeout } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnDestroy {
  usuario: string = '';
  password: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;

  
  credencialesInvalidas: boolean = false; 
  errorShake: boolean = false;            
  private destroyed = false;

  @ViewChild('passwordField') passwordField?: ElementRef<HTMLInputElement>;

  
  rol: string = 'admin';
  roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'docente', label: 'Docente' },
    { value: 'directivo', label: 'Directivo' }
  ];

  selectRol(value: string): void {
    this.rol = value;
  }


  meshCells: string[] = this.buildMesh();

  private buildMesh(): string[] {
    const total = 10 * 14;
    const on = new Set<number>();
    const on2 = new Set<number>();
    while (on.size < 22) on.add(Math.floor(Math.random() * total));
    while (on2.size < 10) {
      const v = Math.floor(Math.random() * total);
      if (!on.has(v)) on2.add(v);
    }
    const cells: string[] = [];
    for (let i = 0; i < total; i++) {
      cells.push(on.has(i) ? 'on' : on2.has(i) ? 'on2' : '');
    }
    return cells;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  onSubmit(): void {
    if (this.loading) return; 

    if (!this.usuario || !this.password) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.credencialesInvalidas = false;

    const inicioCarga = Date.now();
    const tiempoMinimo = 1000; 
    let respondio = false;

    this.authService.login(this.usuario, this.password)
      .pipe(timeout(150000)) 
      .subscribe({
        next: (response) => {
          respondio = true;
          const tiempoTranscurrido = Date.now() - inicioCarga;
          const tiempoRestante = Math.max(0, tiempoMinimo - tiempoTranscurrido);

          setTimeout(() => {
            this.loading = false;
            this.refrescar();
            console.log('✅ Login exitoso:', response);
                        const rol = response?.usuario?.rol;
            this.router.navigate([rol === 'DOCENTE' ? '/mi-horario' : '/dashboard']);
          }, tiempoRestante);
        },
        error: (error) => {
          respondio = true;
          this.mostrarError(error);
        },
        complete: () => {
          if (!respondio) {
            this.mostrarError(null);
          }
        }
      });
  }

  
  limpiarError(): void {
    if (this.errorMessage || this.credencialesInvalidas) {
      this.errorMessage = '';
      this.credencialesInvalidas = false;
    }
  }

  
  private mostrarError(error: any): void {
    this.loading = false;

    const status = error?.status;

    if (error?.name === 'TimeoutError') {
      this.errorMessage = 'El servidor tardó demasiado en responder. Inténtalo de nuevo.';
    } else if (status === 0) {
      this.errorMessage = 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
    } else if (status === 400 || status === 401 || status === 403) {
      this.credencialesInvalidas = true;
      this.errorMessage = error.error?.message || 'Usuario o contraseña incorrectos.';
    } else if (status >= 500) {
      this.errorMessage = 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.';
    } else {
      this.errorMessage = error?.error?.message || 'No se pudo iniciar sesión. Inténtalo de nuevo.';
    }

    console.error('❌ Error en login:', error);

    this.errorShake = true;
    this.refrescar();

    // Deja el cursor en la contraseña, con el texto seleccionado para reescribirlo
    if (this.credencialesInvalidas) {
      const campo = this.passwordField?.nativeElement;
      campo?.focus();
      campo?.select();
    }

    setTimeout(() => {
      this.errorShake = false;
      this.refrescar();
    }, 500);
  }

  
  private refrescar(): void {
    if (!this.destroyed) {
      this.cdr.detectChanges();
    }
  }
}