import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models/product.model';

export interface CartLine {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly linesState = signal<CartLine[]>([]);

  readonly lines = computed(() => this.linesState());
  readonly totalItems = computed(() =>
    this.linesState().reduce((sum, line) => sum + line.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.linesState().reduce(
      (sum, line) => sum + line.product.price * line.quantity,
      0,
    ),
  );

  add(product: Product): void {
    this.linesState.update((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);

      if (existing) {
        return lines.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }

      return [...lines, { product, quantity: 1 }];
    });
  }

  increase(productId: string): void {
    this.linesState.update((lines) =>
      lines.map((line) =>
        line.product.id === productId
          ? { ...line, quantity: line.quantity + 1 }
          : line,
      ),
    );
  }

  decrease(productId: string): void {
    this.linesState.update((lines) =>
      lines
        .map((line) =>
          line.product.id === productId
            ? { ...line, quantity: line.quantity - 1 }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  remove(productId: string): void {
    this.linesState.update((lines) =>
      lines.filter((line) => line.product.id !== productId),
    );
  }

  clear(): void {
    this.linesState.set([]);
  }
}
