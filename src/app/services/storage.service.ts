import { Injectable } from '@angular/core';
import { 
  Storage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject,
  listAll,
  uploadBytesResumable,
  UploadTask,
  UploadTaskSnapshot
} from '@angular/fire/storage';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(private storage: Storage) {}

  // Upload single file
  async uploadFile(
    filePath: string, 
    file: File | Blob
  ): Promise<string> {
    const storageRef = ref(this.storage, filePath);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  // Upload file with progress tracking
  uploadFileWithProgress(
    filePath: string, 
    file: File | Blob
  ): UploadTask {
    const storageRef = ref(this.storage, filePath);
    return uploadBytesResumable(storageRef, file);
  }

  // Upload multiple files
  async uploadMultipleFiles(
    folderPath: string, 
    files: File[]
  ): Promise<string[]> {
    const uploadPromises = files.map(async (file, index) => {
      const randomId = Math.random().toString(36).substring(7);
      const filePath = `${folderPath}/${randomId}_${file.name}`;
      return await this.uploadFile(filePath, file);
    });

    return await Promise.all(uploadPromises);
  }

  // Delete file
  async deleteFile(filePath: string): Promise<void> {
    const storageRef = ref(this.storage, filePath);
    await deleteObject(storageRef);
  }

  // Delete multiple files
  async deleteMultipleFiles(filePaths: string[]): Promise<void> {
    const deletePromises = filePaths.map(path => this.deleteFile(path));
    await Promise.all(deletePromises);
  }

  // Get file URL
  async getFileUrl(filePath: string): Promise<string> {
    const storageRef = ref(this.storage, filePath);
    return await getDownloadURL(storageRef);
  }

  // List all files in a folder
  async listFiles(folderPath: string): Promise<string[]> {
    const storageRef = ref(this.storage, folderPath);
    const result = await listAll(storageRef);
    
    const urlPromises = result.items.map(item => getDownloadURL(item));
    return await Promise.all(urlPromises);
  }

  // Upload profile image
  async uploadProfileImage(
    userId: string, 
    file: File
  ): Promise<string> {
    const filePath = `profile-images/${userId}/profile.jpg`;
    return await this.uploadFile(filePath, file);
  }

  // Upload product images
  async uploadProductImages(
    sellerId: string, 
    productId: string,
    files: File[]
  ): Promise<string[]> {
    const folderPath = `product-images/${sellerId}/${productId}`;
    return await this.uploadMultipleFiles(folderPath, files);
  }

  // Delete product images
  async deleteProductImages(urls: string[]): Promise<void> {
    // Extract paths from URLs and delete
    const deletePromises = urls.map(url => {
      try {
        const path = this.extractPathFromUrl(url);
        return this.deleteFile(path);
      } catch (error) {
        console.error('Error deleting file:', error);
        return Promise.resolve();
      }
    });

    await Promise.all(deletePromises);
  }

  // Helper to extract file path from download URL
  private extractPathFromUrl(url: string): string {
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
    const startIndex = url.indexOf('/o/') + 3;
    const endIndex = url.indexOf('?');
    const encodedPath = url.substring(startIndex, endIndex);
    return decodeURIComponent(encodedPath);
  }

  // Compress and resize image before upload (optional utility)
  async compressImage(
    file: File, 
    maxWidth: number = 1200, 
    maxHeight: number = 1200,
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = reject;
      };

      reader.onerror = reject;
    });
  }
}
