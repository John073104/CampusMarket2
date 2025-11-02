import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ProductService } from '../../../../services/product.service';
import { Product } from '../../../../models/product.model';

@Component({
  selector: 'app-pending-products',
  templateUrl: './pending-products.page.html',
  styleUrls: ['./pending-products.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class PendingProductsPage implements OnInit {
  products: Product[] = [];
  loading: boolean = false;

  constructor(
    private productService: ProductService,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadProducts();
  }

  async loadProducts() {
    this.loading = true;
    try {
      this.products = await this.productService.getPendingProducts();
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.loading = false;
    }
  }

  async approveProduct(productId: string) {
    const alert = await this.alertController.create({
      header: 'Approve Product',
      message: 'Are you sure you want to approve this product?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Approve',
          role: 'confirm',
          handler: async () => {
            try {
              await this.productService.approveProduct(productId);
              await this.loadProducts();
              
              const toast = await this.toastController.create({
                message: 'Product approved successfully!',
                duration: 2000,
                color: 'success',
                position: 'top'
              });
              await toast.present();
            } catch (error) {
              console.error('Error approving product:', error);
              const toast = await this.toastController.create({
                message: 'Failed to approve product. Please try again.',
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

  async deleteProduct(productId: string) {
    const alert = await this.alertController.create({
      header: 'Reject Product',
      message: 'Are you sure you want to reject and delete this product?',
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
                message: 'Product rejected and deleted.',
                duration: 2000,
                color: 'warning',
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
}

