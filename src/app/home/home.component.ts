import { CurrencyPipe, NgClass } from '@angular/common';
import {
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ProductCatalogService } from '../core/data/product-catalog.service';
import { Product } from '../core/models/product.model';
import { CartService } from '../core/state/cart.service';

type PaginationItem = number | 'ellipsis';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CurrencyPipe, NgClass],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnDestroy {
  private readonly catalog = inject(ProductCatalogService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly productsPerPage = 9;
  private addFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

  readonly allProducts = toSignal(this.catalog.getHomeProducts(), {
    initialValue: [],
  });
  readonly recentlyAddedId = signal<string | null>(null);
  readonly quickViewProduct = signal<Product | null>(null);
  readonly selectedCategories = signal<string[]>([]);
  readonly selectedColors = signal<string[]>([]);
  readonly selectedSort = signal('newest');
  readonly selectedMaxPrice = signal(200);
  readonly currentPage = signal(1);
  readonly maxCatalogPrice = computed(() =>
    Math.max(200, ...this.allProducts().map((product) => product.price)),
  );
  readonly categories = computed(() => {
    const counts = new Map<string, number>();
    for (const product of this.allProducts()) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
  readonly colors = computed(() => {
    const colorSet = new Set<string>();
    for (const product of this.allProducts()) {
      for (const color of product.palette ?? []) {
        colorSet.add(color);
      }
      for (const color of product.strapColors ?? []) {
        colorSet.add(color.hex);
      }
    }
    return [...colorSet];
  });
  readonly products = computed(() => {
    const selectedCategories = this.selectedCategories();
    const selectedColors = this.selectedColors();
    const maxPrice = this.selectedMaxPrice();
    const sort = this.selectedSort();

    const filtered = this.allProducts().filter((product) => {
      const categoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category);
      const priceMatch = product.price <= maxPrice;
      const palette = [
        ...(product.palette ?? []),
        ...(product.strapColors?.map((color) => color.hex) ?? []),
      ];
      const colorMatch =
        selectedColors.length === 0 ||
        selectedColors.some((selected) => palette.includes(selected));
      return categoryMatch && colorMatch && priceMatch;
    });

    switch (sort) {
      case 'price-low':
        return [...filtered].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...filtered].sort((a, b) => b.price - a.price);
      case 'name':
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
      default:
        return filtered;
    }
  });
  readonly hasActiveFilters = computed(
    () =>
      this.selectedCategories().length > 0 ||
      this.selectedColors().length > 0 ||
      this.selectedMaxPrice() < this.maxCatalogPrice() ||
      this.selectedSort() !== 'newest',
  );
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.products().length / this.productsPerPage)),
  );
  readonly pagedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.productsPerPage;
    const end = start + this.productsPerPage;
    return this.products().slice(start, end);
  });
  readonly pageItems = computed(() =>
    this.buildPageItems(this.currentPage(), this.totalPages()),
  );

  constructor() {
    effect(() => {
      const current = this.currentPage();
      const total = this.totalPages();

      if (current > total) {
        this.currentPage.set(total);
      }
    });
  }

  badgeLabel(badge: string | undefined): string {
    if (!badge) {
      return '';
    }

    if (badge === 'personalized') {
      return 'Personalized';
    }

    return badge;
  }

  toggleCategory(category: string): void {
    this.selectedCategories.update((selected) =>
      selected.includes(category)
        ? selected.filter((item) => item !== category)
        : [...selected, category],
    );
    this.currentPage.set(1);
  }

  isCategoryActive(category: string): boolean {
    return this.selectedCategories().includes(category);
  }

  toggleColor(color: string): void {
    this.selectedColors.update((selected) =>
      selected.includes(color)
        ? selected.filter((item) => item !== color)
        : [...selected, color],
    );
    this.currentPage.set(1);
  }

  isColorActive(color: string): boolean {
    return this.selectedColors().includes(color);
  }

  updatePriceRange(value: string): void {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      this.selectedMaxPrice.set(parsed);
      this.currentPage.set(1);
    }
  }

  updateSort(value: string): void {
    this.selectedSort.set(value);
    this.currentPage.set(1);
  }

  clearAllFilters(): void {
    this.selectedCategories.set([]);
    this.selectedColors.set([]);
    this.selectedMaxPrice.set(this.maxCatalogPrice());
    this.selectedSort.set('newest');
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    const safePage = Math.min(Math.max(1, page), this.totalPages());
    this.currentPage.set(safePage);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  openQuickView(product: Product, event?: Event): void {
    event?.stopPropagation();
    this.quickViewProduct.set(product);
  }

  closeQuickView(): void {
    this.quickViewProduct.set(null);
  }

  openProduct(product: Product): void {
    void this.router.navigate(['/product', product.id]);
  }

  onProductCta(product: Product, event: Event): void {
    event.stopPropagation();
    if (product.cta === 'customize') {
      this.openProduct(product);
      return;
    }

    this.addToCart(product);
  }

  onQuickViewCta(product: Product): void {
    if (product.cta === 'customize') {
      this.closeQuickView();
      this.openProduct(product);
      return;
    }

    this.addToCart(product);
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
    this.quickViewProduct.set(null);
    if (this.addFeedbackTimer) {
      clearTimeout(this.addFeedbackTimer);
    }
  }

  private buildPageItems(
    currentPage: number,
    totalPages: number,
  ): PaginationItem[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 2) {
      return [1, 2, 3, 'ellipsis', totalPages];
    }

    if (currentPage >= totalPages - 1) {
      return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
    }

    return [
      1,
      'ellipsis',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'ellipsis',
      totalPages,
    ];
  }
}
