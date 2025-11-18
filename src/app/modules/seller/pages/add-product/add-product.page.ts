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
    unitType: 'piece' as 'piece' | 'kg' | 'liter' | 'box' | 'pack' | 'dozen',
    stock: 0,
    images: [] as string[]
  };
  
  unitTypes = [
    { value: 'piece', label: 'Per Piece' },
    { value: 'kg', label: 'Per Kilogram (kg)' },
    { value: 'liter', label: 'Per Liter (L)' },
    { value: 'box', label: 'Per Box' },
    { value: 'pack', label: 'Per Pack' },
    { value: 'dozen', label: 'Per Dozen' }
  ];
  
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

  ionViewWillEnter() {
    // Reset form when entering the page to allow adding multiple products
    this.resetForm();
  }

  async onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Limit to 3 images for faster upload (changed from 5)
      if (files.length > 3) {
        const toast = await this.toastController.create({
          message: 'Maximum 3 images allowed for fast upload',
          duration: 2000,
          color: 'warning'
        });
        await toast.present();
        return;
      }

      this.selectedFiles = [];
      this.imagePreviews = [];
      
      // Show progress toast
      const loadingToast = await this.toastController.create({
        message: 'Compressing images...',
        duration: 1500,
        position: 'bottom'
      });
      await loadingToast.present();
      
      // Compress and prepare images in parallel
      const fileArray = Array.from(files) as File[];
      const compressionPromises = fileArray.map(async (file) => {
        const compressedFile = await this.compressImage(file);
        this.selectedFiles.push(compressedFile);
        
        // Create image preview
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.imagePreviews.push(e.target.result);
            resolve();
          };
          reader.readAsDataURL(compressedFile);
        });
      });
      
      await Promise.all(compressionPromises);
      console.log('Images compressed and ready');
    }
  }

  // Compress image to reduce upload time - OPTIMIZED for speed
  async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Smaller size = faster upload (max 600px instead of 800px)
          const maxSize = 600;
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
          
          // Lower quality = faster processing (0.5 instead of 0.7)
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
            0.5
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
        const toast = await this.toastController.create({
          message: 'User not authenticated. Please log in again.',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
        return;
      }

      console.log('Creating product for user:', user.userId, user.email);
      console.log('Product data:', this.product);
      console.log('Image files:', this.selectedFiles.length);

      // Update loading message
      loading.message = 'Saving product to database...';
      
      // Create product with image files (images stored as base64 in Firestore)
      const productId = await this.productService.createProduct({
        sellerId: user.userId!,
        sellerName: user.name || user.email,
        sellerCourseName: user.courseName || 'N/A',
        title: this.product.title,
        description: this.product.description,
        price: this.product.price,
        category: this.product.category,
        unitType: this.product.unitType,
        images: [],
        approved: false,
        stock: this.product.stock
      }, this.selectedFiles);

      console.log('Product created successfully with ID:', productId);
      
      await loading.dismiss();

      const toast = await this.toastController.create({
        message: 'Product submitted successfully! Waiting for admin approval.',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();

      // Reset form to allow adding more products
      this.resetForm();
      
      // Navigate to products page
      this.router.navigate(['/seller/products']);
    } catch (error: any) {
      console.error('Error creating product:', error);
      console.error('Error details:', error.message, error.code);
      await loading.dismiss();

      const toast = await this.toastController.create({
        message: `Failed to upload product: ${error.message || 'Please try again later.'}`,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.uploading = false;
      this.uploadProgress = 0;
    }
  }

  // Reset form after successful submission
  resetForm() {
    this.product = {
      title: '',
      description: '',
      price: 0,
      category: 'Other' as ProductCategory,
      unitType: 'piece' as 'piece' | 'kg' | 'liter' | 'box' | 'pack' | 'dozen',
      stock: 0,
      images: []
    };
    this.selectedFiles = [];
    this.imagePreviews = [];
    this.uploadProgress = 0;
  }

  goBack() {
    this.router.navigate(['/seller/dashboard']);
  }
}

