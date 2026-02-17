import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models/product.model';

export interface CartLineCustomization {
  initials?: string;
  colorHex?: string;
  colorName?: string;
  sizeLabel?: string;
}

export interface CartAddOptions {
  quantity?: number;
  unitPrice?: number;
  customization?: CartLineCustomization;
}

export interface CartAddEvent {
  productName: string;
  quantity: number;
}

export interface CartLineUpdate {
  customization?: CartLineCustomization;
  unitPrice?: number;
}

export interface CartLine {
  id: string;
  product: Product;
  unitPrice: number;
  customization?: CartLineCustomization;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly linesState = signal<CartLine[]>([]);
  private readonly lastAddedState = signal<CartAddEvent | null>(null);

  readonly lines = computed(() => this.linesState());
  readonly lastAdded = computed(() => this.lastAddedState());
  readonly totalItems = computed(() =>
    this.linesState().reduce((sum, line) => sum + line.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.linesState().reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    ),
  );

  add(product: Product, options?: CartAddOptions): void {
    const quantity = Math.max(1, Math.floor(options?.quantity ?? 1));
    const customization = this.normalizeCustomization(options?.customization);
    const lineId = this.buildLineId(product.id, customization);
    const unitPrice = options?.unitPrice ?? product.price;

    this.linesState.update((lines) => {
      const existing = lines.find((line) => line.id === lineId);

      if (existing) {
        return lines.map((line) =>
          line.id === lineId
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        );
      }

      return [
        ...lines,
        { id: lineId, product, quantity, unitPrice, customization },
      ];
    });
    this.lastAddedState.set({
      productName: product.name,
      quantity,
    });
  }

  increase(lineId: string): void {
    this.linesState.update((lines) =>
      lines.map((line) =>
        line.id === lineId
          ? { ...line, quantity: line.quantity + 1 }
          : line,
      ),
    );
  }

  decrease(lineId: string): void {
    this.linesState.update((lines) =>
      lines
        .map((line) =>
          line.id === lineId
            ? { ...line, quantity: line.quantity - 1 }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  remove(lineId: string): void {
    this.linesState.update((lines) =>
      lines.filter((line) => line.id !== lineId),
    );
  }

  updateLine(lineId: string, update: CartLineUpdate): void {
    this.linesState.update((lines) => {
      const current = lines.find((line) => line.id === lineId);
      if (!current) {
        return lines;
      }

      const nextCustomization = this.normalizeCustomization(update.customization);
      const nextLineId = this.buildLineId(current.product.id, nextCustomization);
      const nextUnitPrice = update.unitPrice ?? current.unitPrice;

      if (nextLineId === lineId) {
        return lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                customization: nextCustomization,
                unitPrice: nextUnitPrice,
              }
            : line,
        );
      }

      const duplicate = lines.find((line) => line.id === nextLineId);
      if (duplicate) {
        return lines
          .filter((line) => line.id !== lineId)
          .map((line) =>
            line.id === nextLineId
              ? { ...line, quantity: line.quantity + current.quantity }
              : line,
          );
      }

      return lines.map((line) =>
        line.id === lineId
          ? {
              ...line,
              id: nextLineId,
              customization: nextCustomization,
              unitPrice: nextUnitPrice,
            }
          : line,
      );
    });
  }

  clear(): void {
    this.linesState.set([]);
  }

  private normalizeCustomization(
    customization?: CartLineCustomization,
  ): CartLineCustomization | undefined {
    if (!customization) {
      return undefined;
    }

    const normalized: CartLineCustomization = {
      initials: customization.initials?.trim() || undefined,
      colorHex: customization.colorHex?.trim() || undefined,
      colorName: customization.colorName?.trim() || undefined,
      sizeLabel: customization.sizeLabel?.trim() || undefined,
    };

    if (
      !normalized.initials &&
      !normalized.colorHex &&
      !normalized.colorName &&
      !normalized.sizeLabel
    ) {
      return undefined;
    }

    return normalized;
  }

  private buildLineId(
    productId: string,
    customization?: CartLineCustomization,
  ): string {
    if (!customization) {
      return `${productId}::base`;
    }

    const initials = customization.initials ?? '';
    const color = customization.colorHex ?? '';
    const size = customization.sizeLabel ?? '';
    return `${productId}::${initials}::${color}::${size}`;
  }
}
