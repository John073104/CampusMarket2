import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ProductService } from '../../../../services/product.service';
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
  loading: boolean = false;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
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
      const user = this.authService.getCurrentUser();
      console.log('Current seller user:', user?.userId, user?.email);
      
      if (user) {
        this.products = await this.productService.getProductsBySeller(user.userId!);
        console.log('Loaded products for seller:', this.products.length, 'products');
        console.log('Products:', this.products);
      } else {
        console.warn('No user found when loading seller products');
        const toast = await this.toastController.create({
          message: 'Please log in to view your products',
          duration: 2000,
          color: 'warning',
          position: 'top'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error loading products:', error);
      const toast = await this.toastController.create({
        message: 'Failed to load products. Please try again.',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  editProduct(productId: string) {
    this.router.navigate(['/seller/edit-product', productId]);
  }

  async deleteProduct(productId: string) {
    const alert = await this.alertController.create({
      header: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'confirm',
          handler: async () => {
            try {
              await this.productService.deleteProduct(productId);
              await this.loadProducts();
              
              const toast = await this.toastController.create({
                message: 'Product deleted successfully!',
                duration: 2000,
                color: 'success',
                position: 'top'
              });
              await toast.present();
            } catch (error) {
              console.error('Error deleting product:', error);
              const toast = await this.toastController.create({
                message: 'Failed to delete product. Please try again.',
                duration: 3000,
                color: 'danger',
                position: 'top'
              });
              await toast.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  addNewProduct() {
    this.router.navigate(['/seller/add-product']);
  }

  getStatusColor(approved: boolean): string {
    return approved ? 'success' : 'warning';
  }

  getStatusText(approved: boolean): string {
    return approved ? 'Approved' : 'Pending Review';
  }
}

