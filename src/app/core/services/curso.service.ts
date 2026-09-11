// src/app/core/services/curso.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private apiUrl = 'http://localhost:3000/api/cursos';

  constructor(private http: HttpClient) {}

  // 📋 Listar cursos
  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // 🔍 Obtener curso por ID
  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // 📝 Crear curso
  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // ✏️ Actualizar curso
  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // 🗑️ Eliminar curso
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 🔍 Buscar cursos
  search(termino: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search?termino=${termino}`);
  }
}