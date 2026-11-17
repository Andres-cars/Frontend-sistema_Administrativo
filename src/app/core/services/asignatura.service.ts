// src/app/core/services/asignatura.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AsignaturaService {
  private apiUrl = 'http://localhost:3000/api/asignaturas';

  constructor(private http: HttpClient) {}

  // 📋 Listar asignaturas
  // getAll()     → solo activas (cargas horarias, dashboard, chat)
  // getAll(true) → todas, también las inactivas (pantalla de Asignaturas)
  getAll(todas: boolean = false): Observable<any> {
    return this.http.get(this.apiUrl, todas ? { params: { todas: 'true' } } : {});
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // ✅ NUEVO: activar / desactivar (no borra nada)
  cambiarEstado(id: number, estado: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, { estado });
  }

  // Se mantiene por si algún otro lugar lo usa, pero Asignaturas ya no lo llama
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  search(termino: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search?termino=${termino}`);
  }
}