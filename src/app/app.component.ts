import { Component } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartLine, CartService } from './core/state/cart.service';

@Component({
  selector: 'app-root',
  imports: [CurrencyPipe, NgClass, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly year = new Date().getFullYear();
  isCartOpen = false;

  constructor(readonly cart: CartService) {}

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
  }

  closeCart(): void {
    this.isCartOpen = false;
  }

  trackByProductId(_: number, line: CartLine): string {
    return line.product.id;
  }
}
