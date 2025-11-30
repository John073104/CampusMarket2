import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ProductService } from '../../../../services/product.service';
import { CartService } from '../../../../services/cart.service';
import { Product } from '../../../../models/product.model';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ProductsPage implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = ['All', 'Food', 'Snacks', 'Accessories', 'Books', 'Electronics', 'Clothing', 'Other'];
  selectedCategory: string = 'All';
  searchTerm: string = '';
  loading: boolean = false;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadProducts();
  }

  ionViewWillEnter() {
    this.loadProducts();
  }

  async loadProducts() {
    this.loading = true;
    try {
      console.log('Loading approved products for customers...');
      this.products = await this.productService.getApprovedProducts();
      console.log('Loaded products:', this.products.length, this.products);
      this.filteredProducts = [...this.products];
      
      if (this.products.length === 0) {
        console.warn('No approved products found. Check if products are approved in admin panel.');
      }
    } catch (error: any) {
      console.error('Error loading products:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        console.error('FIRESTORE PERMISSION DENIED! Please deploy firestore.rules to Firebase.');
        console.error('Run: firebase deploy --only firestore:rules');
      }
    } finally {
      this.loading = false;
    }
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(product => {
      const matchesCategory = this.selectedCategory === 'All' || product.category === this.selectedCategory;
      const matchesSearch = product.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  onCategoryChange() {
    this.filterProducts();
  }

  onSearchChange() {
    this.filterProducts();
  }

  viewProduct(productId: string) {
    this.router.navigate(['/customer/product-detail', productId]);
  }

  async addToCart(product: Product, event: Event) {
    event.stopPropagation();
    try {
      const cartItem = {
        productId: product.productId!,
        productName: product.title,
        productImage: product.images[0] || '',
        price: product.price,
        quantity: 1,
        sellerId: product.sellerId,
        sellerName: product.sellerName
      };
      await this.cartService.addToCart(cartItem);
      // Show success toast
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  }

  goBack() {
    this.router.navigate(['/customer/dashboard']);
  }
}

