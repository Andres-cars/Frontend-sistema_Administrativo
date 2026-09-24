// src/app/features/auth/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
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
export class LoginComponent {
  usuario: string = '';
  password: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;

  // Selector de rol — visual por ahora. Cuando definas cómo tu backend
  // valida el rol (¿lo devuelve el JWT? ¿lo mandas en el body del login?),
  // agrega `rol: this.rol` al payload que envías en authService.login(...)
  rol: string = 'admin';
  roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'docente', label: 'Docente' },
    { value: 'directivo', label: 'Directivo' }
  ];

  selectRol(value: string): void {
    this.rol = value;
  }

  // Celdas de la malla decorativa del panel de marca (16 x 10).
  // Se genera una vez al crear el componente, no en cada change detection.
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
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.usuario || !this.password) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
      const inicioCarga = Date.now();
  const tiempoMinimo = 1000; // 1.5 segundos


    this.authService.login(this.usuario, this.password).subscribe({
      next: (response) => {
        const tiempoTranscurrido = Date.now() - inicioCarga;

      const tiempoRestante =
        Math.max(0, tiempoMinimo - tiempoTranscurrido);

      setTimeout(() => {

        this.loading = false;

        console.log('✅ Login exitoso:', response);

        this.router.navigate(['/dashboard']);

      }, tiempoRestante);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
        console.error('❌ Error en login:', error);
      }
    });
  }
}