import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ProductService } from '../../../../services/product.service';
import { AuthService } from '../../../../services/auth.service';
import { StorageService } from '../../../../services/storage.service';
import { ProductCategory } from '../../../../models/product.model';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.page.html',
  styleUrls: ['./add-product.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AddProductPage implements OnInit {
  product = {
    title: '',
    description: '',
    price: 0,
    category: 'Other' as ProductCategory,
    stock: 0,
    images: [] as string[]
  };
  
  categories: ProductCategory[] = ['Food', 'Accessories', 'Books', 'Snacks', 'Electronics', 'Clothing', 'Other'];
  selectedFiles: File[] = [];
  uploading: boolean = false;
  imagePreviews: string[] = [];
  uploadProgress: number = 0;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private storageService: StorageService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
  }

  async onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Limit to 5 images
      if (files.length > 5) {
        const toast = await this.toastController.create({
          message: 'Maximum 5 images allowed',
          duration: 2000,
          color: 'warning'
        });
        await toast.present();
        return;
      }

      this.selectedFiles = [];
      this.imagePreviews = [];
      
      // Compress and prepare images
      for (const file of Array.from(files) as File[]) {
        const compressedFile = await this.compressImage(file);
        this.selectedFiles.push(compressedFile);
        
        // Create image preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(compressedFile);
      }
    }
  }

  // Compress image to reduce upload time
  async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize to smaller size for Firestore storage (max 800px)
          const maxSize = 800;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with higher compression (0.7 quality for smaller file size)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.7
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  async submitProduct() {
    if (!this.product.title || !this.product.description || this.product.price <= 0) {
      const toast = await this.toastController.create({
        message: 'Please fill in all required fields',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    if (this.selectedFiles.length === 0) {
      const toast = await this.toastController.create({
        message: 'Please add at least one product image',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    // Show confirmation
    const alert = await this.alertController.create({
      header: 'Add Product',
      message: 'Submit this product for admin approval?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Submit', 
          role: 'confirm',
          handler: () => this.uploadProduct()
        }
      ]
    });
    await alert.present();
  }

  async uploadProduct() {
    const loading = await this.loadingController.create({
      message: 'Preparing images...',
      spinner: 'crescent'
    });
    await loading.present();

    this.uploading = true;
    this.uploadProgress = 0;
    
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        await loading.dismiss();
        return;
      }

      // Update loading message
      loading.message = 'Saving product to database...';
      
      // Create product with image files (images stored as base64 in Firestore)
      await this.productService.createProduct({
        sellerId: user.userId!,
        sellerName: user.name || user.email,
        title: this.product.title,
        description: this.product.description,
        price: this.product.price,
        category: this.product.category,
        images: [],
        approved: false,
        stock: this.product.stock
      }, this.selectedFiles);

      await loading.dismiss();

      const toast = await this.toastController.create({
        message: 'Product submitted successfully! Waiting for admin approval.',
        duration: 3000,
        color: 'success'
      });
      await toast.present();

      this.router.navigate(['/seller/products']);
    } catch (error) {
      console.error('Error creating product:', error);
      await loading.dismiss();

      const toast = await this.toastController.create({
        message: 'Failed to upload product. Please try again.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.uploading = false;
      this.uploadProgress = 0;
    }
  }

  goBack() {
    this.router.navigate(['/seller/dashboard']);
  }
}

