import { AsyncPipe, CurrencyPipe, NgClass } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ProductCatalogService } from '../core/data/product-catalog.service';
import { Product } from '../core/models/product.model';
import { CartService } from '../core/state/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, NgClass],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnDestroy {
  private readonly catalog = inject(ProductCatalogService);
  private readonly cart = inject(CartService);
  private addFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

  readonly products$ = this.catalog.getHomeProducts();
  readonly recentlyAddedId = signal<string | null>(null);
  readonly categories = [
    { name: 'Baby Collection', count: 24 },
    { name: 'Personalized Gifts', count: 18, active: true },
    { name: 'Accessories', count: 32 },
    { name: 'Home & Lifestyle', count: 12 },
  ];
  readonly colors = ['#f6ede4', '#dce8d5', '#f8f8f8', '#efe0cb', '#dce4f2'];

  badgeLabel(badge: string | undefined): string {
    if (!badge) {
      return '';
    }

    if (badge === 'personalized') {
      return 'Personalized';
    }

    return badge;
  }

  addToCart(product: Product): void {
    this.cart.add(product);
    this.recentlyAddedId.set(product.id);

    if (this.addFeedbackTimer) {
      clearTimeout(this.addFeedbackTimer);
    }

    this.addFeedbackTimer = setTimeout(() => {
      this.recentlyAddedId.set(null);
      this.addFeedbackTimer = null;
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.addFeedbackTimer) {
      clearTimeout(this.addFeedbackTimer);
    }
  }
}
