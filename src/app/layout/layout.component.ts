// src/app/layout/layout.component.ts
import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';

interface ItemMenu {
  label: string;
  icono: string;
  ruta: string;
  exacto?: boolean;
}

interface SeccionMenu {
  titulo: string;
  soloAdmin: boolean;
  items: ItemMenu[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy {

  usuario: any = null;
  sidebarAbierto = true;
  esMovil = false;

  private navSub?: Subscription;

  // Menú agrupado por secciones
  menu: SeccionMenu[] = [
    {
      titulo: 'Principal',
      soloAdmin: false,
      items: [
        { label: 'Dashboard', icono: '📊', ruta: '/dashboard', exacto: true }
      ]
    },
    {
      titulo: 'Gestión académica',
      soloAdmin: true,
      items: [
        { label: 'Docentes', icono: '👨‍🏫', ruta: '/docentes' },
        { label: 'Cursos', icono: '🏫', ruta: '/cursos' },
        { label: 'Asignaturas', icono: '📚', ruta: '/asignaturas' },
        { label: 'Aulas', icono: '🏛️', ruta: '/aulas' }
      ]
    },
    {
      titulo: 'Planificación',
      soloAdmin: true,
      items: [
        { label: 'Cargas horarias', icono: '📅', ruta: '/cargas-horarias' },
        { label: 'Generar horarios', icono: '🧬', ruta: '/horarios' }
      ]
    },
    {
      titulo: 'Sistema',
      soloAdmin: true,
      items: [
        { label: 'Administradores', icono: '👑', ruta: '/admins' }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.esMovil = window.innerWidth < 992;
    this.sidebarAbierto = !this.esMovil;

    // En celular, cerrar el menú al navegar
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.esMovil && this.sidebarAbierto) {
          this.sidebarAbierto = false;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  // Solo reacciona cuando se cruza el límite escritorio/celular
  @HostListener('window:resize')
  onResize(): void {
    const ahoraMovil = window.innerWidth < 992;
    if (ahoraMovil !== this.esMovil) {
      this.esMovil = ahoraMovil;
      this.sidebarAbierto = !ahoraMovil;
      this.cdr.detectChanges();
    }
  }

  get esAdmin(): boolean {
    return this.usuario?.rol === 'ADMINISTRADOR';
  }

  get inicial(): string {
    return (this.usuario?.usuario || 'U').charAt(0).toUpperCase();
  }

  toggleSidebar(): void {
    this.sidebarAbierto = !this.sidebarAbierto;
  }

  cerrarSidebar(): void {
    this.sidebarAbierto = false;
  }

  logout(): void {
    this.authService.logout();
  }
}