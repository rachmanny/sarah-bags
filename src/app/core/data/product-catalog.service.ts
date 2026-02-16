import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Product } from '../models/product.model';
import { MOCK_PRODUCTS } from './mock-products';

@Injectable({ providedIn: 'root' })
export class ProductCatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = '/api';

  getHomeProducts(): Observable<Product[]> {
    // Replace this with:
    // return this.http.get<Product[]>(`${this.apiBase}/products/home`);
    return of(MOCK_PRODUCTS);
  }

  warmupBackendConnection(): Observable<unknown> {
    return this.http.get(`${this.apiBase}/health`);
  }
}
