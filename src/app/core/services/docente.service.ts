// src/app/core/services/docente.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  private apiUrl = 'http://localhost:3000/api/docentes';

  constructor(private http: HttpClient) {}

  // 📋 Listar docentes
  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // 🔍 Obtener docente por ID
  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // 📝 Crear docente
  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // ✏️ Actualizar docente
  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // 🗑️ Eliminar docente
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 🔍 Buscar docentes
  search(termino: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search?termino=${termino}`);
  }
}