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
import { 
  Storage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from '@angular/fire/storage';
import { Product } from '../models/product.model';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(
    private firestore: Firestore,
    private storage: Storage
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
    
    return docRef.id;
  }

  // Upload product images to Firebase Storage
  private async uploadProductImages(
    sellerId: string, 
    files: File[]
  ): Promise<string[]> {
    const uploadPromises = files.map(async (file) => {
      const randomId = Math.random().toString(36).substring(7);
      const filePath = `product-images/${sellerId}/${randomId}_${file.name}`;
      const storageRef = ref(this.storage, filePath);
      
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    });

    return await Promise.all(uploadPromises);
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
    await updateDoc(doc(this.firestore, 'products', productId), {
      approved: true,
      updatedAt: serverTimestamp()
    });
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