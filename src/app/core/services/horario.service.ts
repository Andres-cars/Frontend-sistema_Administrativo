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
  generar(periodoId: number, jornadaId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/generar`, { periodoId, jornadaId });
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
}