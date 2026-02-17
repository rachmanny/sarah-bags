import { Component, OnDestroy, effect, signal } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartLine, CartService } from './core/state/cart.service';
import { ProductColorOption, ProductSizeOption } from './core/models/product.model';

@Component({
  selector: 'app-root',
  imports: [CurrencyPipe, NgClass, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnDestroy {
  readonly year = new Date().getFullYear();
  isCartOpen = false;
  readonly cartToast = signal<{ message: string } | null>(null);
  readonly editingLineId = signal<string | null>(null);
  readonly draftInitials = signal('');
  readonly draftSize = signal<string | null>(null);
  readonly draftColorHex = signal<string | null>(null);
  private cartToastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly cart: CartService) {
    effect(() => {
      const event = this.cart.lastAdded();
      if (!event) {
        return;
      }

      const quantityLabel = event.quantity > 1 ? ` (${event.quantity})` : '';
      this.cartToast.set({
        message: `Added ${event.productName}${quantityLabel}`,
      });

      if (this.cartToastTimer) {
        clearTimeout(this.cartToastTimer);
      }

      this.cartToastTimer = setTimeout(() => {
        this.cartToast.set(null);
        this.cartToastTimer = null;
      }, 4200);
    });
  }

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
  }

  closeCart(): void {
    this.isCartOpen = false;
    this.cancelLineEdit();
  }

  openCartFromToast(): void {
    this.isCartOpen = true;
    this.cartToast.set(null);
    if (this.cartToastTimer) {
      clearTimeout(this.cartToastTimer);
      this.cartToastTimer = null;
    }
  }

  dismissCartToast(): void {
    this.cartToast.set(null);
    if (this.cartToastTimer) {
      clearTimeout(this.cartToastTimer);
      this.cartToastTimer = null;
    }
  }

  canEditLine(line: CartLine): boolean {
    const product = line.product;
    return (
      product.cta === 'customize' ||
      Boolean(product.maxInitials) ||
      Boolean(product.sizes?.length) ||
      Boolean(product.strapColors?.length)
    );
  }

  startLineEdit(line: CartLine): void {
    this.editingLineId.set(line.id);
    this.draftInitials.set(line.customization?.initials ?? '');
    this.draftSize.set(line.customization?.sizeLabel ?? null);
    this.draftColorHex.set(line.customization?.colorHex ?? null);
  }

  cancelLineEdit(): void {
    this.editingLineId.set(null);
    this.draftInitials.set('');
    this.draftSize.set(null);
    this.draftColorHex.set(null);
  }

  updateDraftInitials(value: string, maxInitials = 3): void {
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, maxInitials);
    this.draftInitials.set(clean);
  }

  setDraftSize(size: ProductSizeOption): void {
    this.draftSize.set(size.label);
  }

  setDraftColor(color: ProductColorOption): void {
    this.draftColorHex.set(color.hex);
  }

  saveLineEdit(line: CartLine): void {
    const selectedSize = line.product.sizes?.find(
      (size) => size.label === this.draftSize(),
    );
    const selectedColor = line.product.strapColors?.find(
      (color) => color.hex === this.draftColorHex(),
    );
    const unitPrice = line.product.price + (selectedSize?.priceDelta ?? 0);

    this.cart.updateLine(line.id, {
      unitPrice,
      customization: {
        initials: this.draftInitials() || undefined,
        sizeLabel: this.draftSize() ?? undefined,
        colorHex: this.draftColorHex() ?? undefined,
        colorName: selectedColor?.name,
      },
    });
    this.cancelLineEdit();
  }

  trackByLineId(_: number, line: CartLine): string {
    return line.id;
  }

  ngOnDestroy(): void {
    if (this.cartToastTimer) {
      clearTimeout(this.cartToastTimer);
    }
  }
}
