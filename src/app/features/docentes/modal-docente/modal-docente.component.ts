import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocenteService } from '../../../core/services/docente.service';

@Component({
  selector: 'app-modal-docente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-docente.component.html',
  styleUrls: ['./modal-docente.component.css']
})
export class ModalDocenteComponent implements OnInit {

  @Input() visible = false;
  @Input() docenteId: number | null = null;

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<string>();

  docente: any = {
    nombres: '',
    apellidos: '',
    identificacion: '',
    especialidad: '',
    usuario: '',
    password: ''
  };

  isEdit = false;
  loading = false;
  errorMessage = '';

  constructor(private docenteService: DocenteService) {}

  ngOnInit(): void {
    if (this.docenteId) {
      this.isEdit = true;
      this.cargarDocente(this.docenteId);
    } else {
      this.isEdit = false;
      this.resetForm();
    }
  }

  resetForm(): void {
    this.docente = {
      nombres: '',
      apellidos: '',
      identificacion: '',
      especialidad: '',
      usuario: '',
      password: ''
    };
    this.errorMessage = '';
  }

  cargarDocente(id: number): void {
    this.loading = true;
    this.docenteService.getById(id).subscribe({
      next: (res) => {
        this.docente = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al cargar docente';
      }
    });
  }

  onSubmit(): void {
    if (!this.docente.nombres || !this.docente.apellidos) {
      this.errorMessage = 'Nombres y apellidos son obligatorios';
      return;
    }
    if (!this.isEdit && this.docente.usuario && !this.docente.password) {
      this.errorMessage = 'La contraseña es obligatoria si se crea un usuario';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const data = { ...this.docente };

    const request$ = this.isEdit
      ? this.docenteService.update(this.docente.id, data)
      : this.docenteService.create(data);

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.guardado.emit(
          this.isEdit ? 'Docente actualizado correctamente' : 'Docente creado correctamente'
        );
        this.cerrarModal();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al guardar docente';
      }
    });
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }
}