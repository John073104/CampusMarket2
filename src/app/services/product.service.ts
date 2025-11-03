import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp 
} from '@angular/fire/firestore';
import { Product } from '../models/product.model';
import { Observable, from } from 'rxjs';
import { NotificationService } from './notification.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(
    private firestore: Firestore,
    private notificationService: NotificationService,
    private userService: UserService
  ) {}

  // Create new product
  async createProduct(
    product: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>,
    imageFiles: File[]
  ): Promise<string> {
    // Upload images first
    const imageUrls = await this.uploadProductImages(
      product.sellerId, 
      imageFiles
    );

    const newProduct: any = {
      ...product,
      images: imageUrls,
      approved: false, // Requires admin approval
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(
      collection(this.firestore, 'products'), 
      newProduct
    );
    
    // Notify all admins about new product submission
    await this.notifyAdminsAboutNewProduct(product.title, product.sellerName);
    
    return docRef.id;
  }

  // Notify all admin users about new product
  private async notifyAdminsAboutNewProduct(productTitle: string, sellerName: string): Promise<void> {
    try {
      const admins = await this.userService.getAdminUsers();
      const notifyPromises = admins.map(admin =>
        this.notificationService.createNotification(
          admin.userId,
          'New Product Pending Review',
          `${sellerName} submitted "${productTitle}" for approval`,
          'product'
        )
      );
      await Promise.all(notifyPromises);
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }

  // Convert images to base64 for Firestore storage (no Firebase Storage needed)
  private async uploadProductImages(
    sellerId: string, 
    files: File[]
  ): Promise<string[]> {
    const base64Promises = files.map(async (file) => {
      return await this.fileToBase64(file);
    });

    return await Promise.all(base64Promises);
  }

  // Convert File to base64 string
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Get all products (Admin)
  async getAllProducts(): Promise<Product[]> {
    const q = query(
      collection(this.firestore, 'products'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      productId: doc.id,
      ...doc.data()
    } as Product));
  }

  // Get approved products (for customers)
  async getApprovedProducts(): Promise<Product[]> {
    const q = query(
      collection(this.firestore, 'products'),
      where('approved', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      productId: doc.id,
      ...doc.data()
    } as Product));
  }

  // Get products by seller
  async getProductsBySeller(sellerId: string): Promise<Product[]> {
    const q = query(
      collection(this.firestore, 'products'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      productId: doc.id,
      ...doc.data()
    } as Product));
  }

  // Get pending products (Admin)
  async getPendingProducts(): Promise<Product[]> {
    const q = query(
      collection(this.firestore, 'products'),
      where('approved', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      productId: doc.id,
      ...doc.data()
    } as Product));
  }

  // Approve product (Admin)
  async approveProduct(productId: string): Promise<void> {
    // Get product details first
    const product = await this.getProductById(productId);
    
    await updateDoc(doc(this.firestore, 'products', productId), {
      approved: true,
      updatedAt: serverTimestamp()
    });

    // Notify seller about approval
    if (product) {
      await this.notificationService.notifyProductApproved(
        product.sellerId,
        productId,
        product.title
      );
    }
  }

  // Update product
  async updateProduct(
    productId: string,
    updates: Partial<Product>
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'products', productId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Delete product
  async deleteProduct(productId: string): Promise<void> {
    // TODO: Delete associated images from storage
    await deleteDoc(doc(this.firestore, 'products', productId));
  }

  // Get product by ID
  async getProductById(productId: string): Promise<Product | null> {
    const productDoc = await getDoc(doc(this.firestore, 'products', productId));
    return productDoc.exists() ? {
      productId: productDoc.id,
      ...productDoc.data()
    } as Product : null;
  }

  // Search products
  async searchProducts(searchTerm: string): Promise<Product[]> {
    const allProducts = await this.getApprovedProducts();
    return allProducts.filter(product => 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Filter products by category
  async filterByCategory(category: string): Promise<Product[]> {
    const q = query(
      collection(this.firestore, 'products'),
      where('approved', '==', true),
      where('category', '==', category)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      productId: doc.id,
      ...doc.data()
    } as Product));
  }
}