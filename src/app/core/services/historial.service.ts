// src/app/core/services/historial.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private apiUrl = 'http://localhost:3000/api/historial';

  constructor(private http: HttpClient) {}

  // 📋 Historial de cambios (solo admin). tabla: 'cargas_horarias' | 'horarios'
  getAll(tabla?: string): Observable<any> {
    let params = new HttpParams();
    if (tabla) params = params.set('tabla', tabla);
    return this.http.get(this.apiUrl, { params });
  }
}