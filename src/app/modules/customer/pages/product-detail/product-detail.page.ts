import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../services/product.service';
import { CartService } from '../../../../services/cart.service';
import { ChatService } from '../../../../services/chat.service';
import { AuthService } from '../../../../services/auth.service';
import { Product } from '../../../../models/product.model';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ProductDetailPage implements OnInit {
  product: Product | null = null;
  quantity: number = 1;
  loading: boolean = false;
  selectedImageIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private chatService: ChatService,
    private authService: AuthService,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    }
  }

  async loadProduct(productId: string) {
    this.loading = true;
    try {
      this.product = await this.productService.getProductById(productId);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      this.loading = false;
    }
  }

  incrementQuantity() {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  selectImage(index: number) {
    this.selectedImageIndex = index;
  }

  async addToCart() {
    if (!this.product) return;
    
    try {
      const cartItem = {
        productId: this.product.productId!,
        productName: this.product.title,
        productImage: this.product.images[0] || '',
        price: this.product.price,
        quantity: this.quantity,
        sellerId: this.product.sellerId,
        sellerName: this.product.sellerName
      };
      await this.cartService.addToCart(cartItem);
      
      // Show success modal with checkout option
      const alert = await this.alertController.create({
        header: '✅ Added to Cart!',
        message: `${this.product.title} has been added to your cart successfully.`,
        buttons: [
          {
            text: 'Continue Shopping',
            role: 'cancel',
            handler: () => {
              this.router.navigate(['/customer/products']);
            }
          },
          {
            text: 'Checkout Now',
            handler: () => {
              this.router.navigate(['/customer/cart']);
            }
          }
        ]
      });
      
      await alert.present();
    } catch (error) {
      console.error('Error adding to cart:', error);
      const toast = document.createElement('ion-toast');
      toast.message = 'Failed to add to cart';
      toast.duration = 2000;
      toast.color = 'danger';
      toast.position = 'top';
      document.body.appendChild(toast);
      await toast.present();
    }
  }

  async messageSeller() {
    if (!this.product) return;
    
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    try {
      const chatId = await this.chatService.getOrCreateChat(
        user.userId!,
        user.name || user.email,
        this.product.sellerId,
        this.product.sellerName
      );
      this.router.navigate([`/customer/chat/${chatId}`]);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  }

  goBack() {
    this.router.navigate(['/customer/products']);
  }
}


