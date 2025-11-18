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

  // Create new product - OPTIMIZED for speed
  async createProduct(
    product: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>,
    imageFiles: File[]
  ): Promise<string> {
    try {
      console.log('Starting fast product creation...', product.title);
      
      // Process images in parallel for speed
      const imageUrls = await this.uploadProductImages(product.sellerId, imageFiles);

      const newProduct: any = {
        ...product,
        images: imageUrls,
        approved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to Firestore immediately (don't wait for notifications)
      const docRef = await addDoc(
        collection(this.firestore, 'products'), 
        newProduct
      );
      
      console.log('Product saved with ID:', docRef.id);
      
      // Notify admins in background (don't wait)
      this.notifyAdminsAboutNewProduct(product.title, product.sellerName)
        .catch(err => console.error('Notification failed (non-blocking):', err));
      
      return docRef.id;
    } catch (error: any) {
      console.error('Error in createProduct:', error);
      throw new Error(error.message || 'Failed to create product');
    }
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

  // Convert images to base64 - OPTIMIZED for speed
  private async uploadProductImages(
    sellerId: string, 
    files: File[]
  ): Promise<string[]> {
    console.log(`Fast converting ${files.length} images...`);
    const startTime = Date.now();
    
    // Process all images in parallel for maximum speed
    const results = await Promise.all(
      files.map(file => this.fileToBase64(file))
    );
    
    const duration = Date.now() - startTime;
    console.log(`Images converted in ${duration}ms (${(duration / files.length).toFixed(0)}ms per image)`);
    return results;
  }

  // Convert File to base64 string - OPTIMIZED
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read: ' + file.name));
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
    try {
      console.log('Fetching approved products with composite index...');
      const q = query(
        collection(this.firestore, 'products'),
        where('approved', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      console.log('Found approved products:', snapshot.docs.length);
      return snapshot.docs.map(doc => ({
        productId: doc.id,
        ...doc.data()
      } as Product));
    } catch (error: any) {
      console.warn('Composite index not available, using fallback query...', error);
      
      // Fallback: Query without orderBy if index doesn't exist
      const fallbackQuery = query(
        collection(this.firestore, 'products'),
        where('approved', '==', true)
      );
      
      const snapshot = await getDocs(fallbackQuery);
      const products = snapshot.docs.map(doc => ({
        productId: doc.id,
        ...doc.data()
      } as Product));
      
      // Sort manually by createdAt
      products.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log('Fallback query found products:', products.length);
      return products;
    }
  }

  // Get products by seller
  async getProductsBySeller(sellerId: string): Promise<Product[]> {
    try {
      const q = query(
        collection(this.firestore, 'products'),
        where('sellerId', '==', sellerId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      console.log(`Seller products count for ${sellerId}:`, snapshot.size);
      return snapshot.docs.map(doc => ({
        productId: doc.id,
        ...doc.data()
      } as Product));
    } catch (error: any) {
      // Fallback: Query without orderBy if composite index doesn't exist
      console.warn('Composite index not available for seller products, using fallback...', error);
      
      const fallbackQuery = query(
        collection(this.firestore, 'products'),
        where('sellerId', '==', sellerId)
      );
      
      const snapshot = await getDocs(fallbackQuery);
      console.log(`Fallback query - Seller products count for ${sellerId}:`, snapshot.size);
      
      const products = snapshot.docs.map(doc => ({
        productId: doc.id,
        ...doc.data()
      } as Product));
      
      // Sort manually by createdAt
      products.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // Descending order (newest first)
      });
      
      console.log('Seller products (sorted):', products);
      return products;
    }
  }

  // Get pending products (Admin)
  async getPendingProducts(): Promise<Product[]> {
    try {
      // Try with orderBy first
      const q = query(
        collection(this.firestore, 'products'),
        where('approved', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      console.log('Pending products count:', snapshot.size);
      const products = snapshot.docs.map(doc => ({
        productId: doc.id,
        ...doc.data()
      } as Product));
      console.log('Pending products:', products);
      return products;
    } catch (error: any) {
      // If composite index error, try without orderBy
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.warn('Using query without orderBy due to missing index');
        const q = query(
          collection(this.firestore, 'products'),
          where('approved', '==', false)
        );
        
        const snapshot = await getDocs(q);
        console.log('Pending products count (no orderBy):', snapshot.size);
        const products = snapshot.docs.map(doc => ({
          productId: doc.id,
          ...doc.data()
        } as Product));
        
        // Sort manually by createdAt
        products.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        
        console.log('Pending products (sorted):', products);
        return products;
      }
      throw error;
    }
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