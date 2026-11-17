// src/app/core/services/horario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {
  private apiUrl = 'http://localhost:3000/api/horarios';

  constructor(private http: HttpClient) {}

  // 🧬 Generar horario (sin guardar)
  generar(periodoId: number, jornadaId: number, cursoId: number | null = null): Observable<any> {
    return this.http.post(`${this.apiUrl}/generar`, { periodoId, jornadaId, cursoId  });
  }

  // 💾 Guardar horario
  guardar(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar`, data);
  }

  // 📋 Listar horarios
  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // 🔍 Obtener horario por ID
  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // 🗑️ Eliminar horario
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

    // 👨‍🏫 Mis clases (solo DOCENTE)
  misClases(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-clases`);
  }

    // 👨‍🏫 Horario de un docente (solo admin)
  clasesDocente(docenteId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/docente/${docenteId}`);
  }
  
    // 📢 HU-13: publicar o retirar un horario
  cambiarPublicacion(id: number, publicado: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/publicar`, { publicado });
  }
}