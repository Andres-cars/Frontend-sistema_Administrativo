// src/app/core/services/periodo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PeriodoService {
  private apiUrl = 'http://localhost:3000/api/periodos';

  constructor(private http: HttpClient) {}

  // 📋 Listar periodos (todos = true incluye los desactivados)
  getAll(todos: boolean = false): Observable<any> {
    let params = new HttpParams();
    if (todos) params = params.set('todos', 'true');
    return this.http.get(this.apiUrl, { params });
  }

  // 📅 Periodo actual (el activo más reciente)
  getActual(): Observable<any> {
    return this.http.get(`${this.apiUrl}/actual`);
  }

  // 🔍 Obtener por ID
  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // 📝 Crear
  create(data: { nombre: string; fecha_inicio: string; fecha_fin: string }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // ✏️ Editar
  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // ⏸️ Activar / desactivar
  cambiarEstado(id: number, estado: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, { estado });
  }
}