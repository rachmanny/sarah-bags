import { CurrencyPipe, Location, NgClass } from '@angular/common';
import {
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ProductCatalogService } from '../core/data/product-catalog.service';
import { Product, ProductColorOption, ProductSizeOption } from '../core/models/product.model';
import { CartLineCustomization, CartService } from '../core/state/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CurrencyPipe, NgClass, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly catalog = inject(ProductCatalogService);
  private readonly cart = inject(CartService);
  private addFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

  readonly product = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      switchMap((id) => this.catalog.getProductById(id)),
    ),
    { initialValue: null },
  );
  readonly selectedImage = signal('');
  readonly selectedInitials = signal('');
  readonly selectedSize = signal<string | null>(null);
  readonly selectedColor = signal<string | null>(null);
  readonly quantity = signal(1);
  readonly addFeedback = signal(false);
  readonly selectedSizePriceDelta = computed(() => {
    const size = this.currentSize();
    return size?.priceDelta ?? 0;
  });
  readonly displayPrice = computed(() => {
    const current = this.product();
    if (!current) {
      return 0;
    }
    return current.price + this.selectedSizePriceDelta();
  });
  readonly totalPrice = computed(() => this.displayPrice() * this.quantity());
  readonly gallery = computed(() => {
    const current = this.product();
    if (!current) {
      return [];
    }

    if (current.gallery?.length) {
      return current.gallery;
    }

    return [current.image];
  });
  readonly currentSize = computed(() => {
    const current = this.product();
    const selected = this.selectedSize();
    if (!current?.sizes?.length || !selected) {
      return null;
    }
    return current.sizes.find((size) => size.label === selected) ?? null;
  });
  readonly selectedColorName = computed(() => {
    const current = this.product();
    const selectedHex = this.selectedColor();
    if (!current?.strapColors?.length || !selectedHex) {
      return null;
    }

    return (
      current.strapColors.find((option) => option.hex === selectedHex)?.name ??
      null
    );
  });

  constructor() {
    effect(() => {
      const current = this.product();
      if (!current) {
        return;
      }

      this.selectedImage.set(this.gallery()[0] ?? current.image);
      this.selectedInitials.set('');
      this.quantity.set(1);
      this.selectedSize.set(current.sizes?.[0]?.label ?? null);
      this.selectedColor.set(current.strapColors?.[0]?.hex ?? null);
      this.addFeedback.set(false);
    });
  }

  selectImage(image: string): void {
    this.selectedImage.set(image);
  }

  updateInitials(value: string): void {
    const current = this.product();
    const max = current?.maxInitials ?? 3;
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, max);
    this.selectedInitials.set(clean);
  }

  setSize(size: ProductSizeOption): void {
    this.selectedSize.set(size.label);
  }

  setColor(color: ProductColorOption): void {
    this.selectedColor.set(color.hex);
  }

  decreaseQuantity(): void {
    this.quantity.update((quantity) => Math.max(1, quantity - 1));
  }

  increaseQuantity(): void {
    this.quantity.update((quantity) => Math.min(99, quantity + 1));
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigate(['/']);
  }

  addToCart(): void {
    const current = this.product();
    if (!current) {
      return;
    }

    const customization: CartLineCustomization = {
      initials: this.selectedInitials() || undefined,
      colorHex: this.selectedColor() ?? undefined,
      colorName: this.selectedColorName() ?? undefined,
      sizeLabel: this.selectedSize() ?? undefined,
    };

    this.cart.add(current, {
      quantity: this.quantity(),
      unitPrice: this.displayPrice(),
      customization,
    });

    this.addFeedback.set(true);
    if (this.addFeedbackTimer) {
      clearTimeout(this.addFeedbackTimer);
    }
    this.addFeedbackTimer = setTimeout(() => {
      this.addFeedback.set(false);
      this.addFeedbackTimer = null;
    }, 1200);
  }

  ngOnDestroy(): void {
    if (this.addFeedbackTimer) {
      clearTimeout(this.addFeedbackTimer);
    }
  }
}
