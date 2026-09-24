// src/app/core/services/carga-horaria.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CargaHorariaService {
  private apiUrl = 'http://localhost:3000/api/cargas-horarias';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
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

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getByDocente(docenteId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/docente/${docenteId}`);
  }

  getByCurso(cursoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/curso/${cursoId}`);
  }
}