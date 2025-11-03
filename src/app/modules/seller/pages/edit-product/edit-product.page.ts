import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../../services/product.service';
import { AuthService } from '../../../../services/auth.service';
import { Product, ProductCategory } from '../../../../models/product.model';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.page.html',
  styleUrls: ['./edit-product.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class EditProductPage implements OnInit {
  productId: string = '';
  product: Product | null = null;
  categories: ProductCategory[] = ['Food', 'Accessories', 'Books', 'Snacks', 'Electronics', 'Clothing', 'Other'];
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  updating: boolean = false;
  loading: boolean = true;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  async ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    await this.loadProduct();
  }

  async loadProduct() {
    try {
      this.product = await this.productService.getProductById(this.productId);
      if (this.product) {
        this.imagePreviews = [...this.product.images];
      }
    } catch (error) {
      console.error('Error loading product:', error);
      const toast = await this.toastController.create({
        message: 'Failed to load product',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      this.router.navigate(['/seller/products']);
    } finally {
      this.loading = false;
    }
  }

  async onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Limit to 5 images
      if (files.length + this.imagePreviews.length > 5) {
        const toast = await this.toastController.create({
          message: 'Maximum 5 images allowed',
          duration: 2000,
          color: 'warning'
        });
        await toast.present();
        return;
      }

      this.selectedFiles = [];
      
      // Compress and prepare new images
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

  async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
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
    this.imagePreviews.splice(index, 1);
    if (index < this.product!.images.length) {
      this.product!.images.splice(index, 1);
    }
  }

  async updateProduct() {
    if (!this.product) return;

    const alert = await this.alertController.create({
      header: 'Update Product',
      message: 'Save changes to this product?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Update', 
          role: 'confirm',
          handler: () => this.saveProduct()
        }
      ]
    });
    await alert.present();
  }

  async saveProduct() {
    const loading = await this.loadingController.create({
      message: 'Updating product...',
      spinner: 'crescent'
    });
    await loading.present();

    this.updating = true;
    try {
      // Convert new images to base64 if any
      let allImages = [...this.product!.images];
      
      if (this.selectedFiles.length > 0) {
        const newImageUrls = await Promise.all(
          this.selectedFiles.map(file => this.fileToBase64(file))
        );
        allImages = [...allImages, ...newImageUrls];
      }

      await this.productService.updateProduct(this.productId, {
        title: this.product!.title,
        description: this.product!.description,
        price: this.product!.price,
        category: this.product!.category,
        stock: this.product!.stock,
        images: allImages
      });

      await loading.dismiss();

      const toast = await this.toastController.create({
        message: 'Product updated successfully!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      this.router.navigate(['/seller/products']);
    } catch (error) {
      console.error('Error updating product:', error);
      await loading.dismiss();

      const toast = await this.toastController.create({
        message: 'Failed to update product',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.updating = false;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  goBack() {
    this.router.navigate(['/seller/products']);
  }
}


