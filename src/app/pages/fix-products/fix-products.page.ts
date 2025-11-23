import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Firestore } from '@angular/fire/firestore';
import { 
  findProductsWithBadNames, 
  updateProductName, 
  ProductNameIssue 
} from '../../utils/fix-product-names';

@Component({
  selector: 'app-fix-products',
  templateUrl: './fix-products.page.html',
  styleUrls: ['./fix-products.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class FixProductsPage implements OnInit {
  loading = false;
  issues: ProductNameIssue[] = [];
  editingProduct: { productId: string; newName: string } | null = null;

  constructor(
    private firestore: Firestore,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.scanProducts();
  }

  async scanProducts() {
    this.loading = true;
    try {
      this.issues = await findProductsWithBadNames(this.firestore);
      
      if (this.issues.length === 0) {
        const toast = await this.toastController.create({
          message: '✅ All product names look correct!',
          duration: 3000,
          color: 'success'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error scanning products:', error);
      const toast = await this.toastController.create({
        message: '❌ Failed to scan products',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  async fixProduct(issue: ProductNameIssue) {
    const alert = await this.alertController.create({
      header: 'Fix Product Name',
      subHeader: `Current: "${issue.currentName}"`,
      message: `Seller: ${issue.sellerName}<br>Category: ${issue.category}<br>Price: ₱${issue.price}`,
      inputs: [
        {
          name: 'newName',
          type: 'text',
          placeholder: 'Enter correct product name',
          attributes: {
            maxlength: 100
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Update',
          handler: async (data) => {
            if (!data.newName || data.newName.trim().length === 0) {
              const toast = await this.toastController.create({
                message: 'Please enter a product name',
                duration: 2000,
                color: 'warning'
              });
              await toast.present();
              return false;
            }
            
            await this.updateProduct(issue.productId, data.newName.trim());
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async updateProduct(productId: string, newName: string) {
    this.loading = true;
    try {
      await updateProductName(this.firestore, productId, newName);
      
      const toast = await this.toastController.create({
        message: `✅ Updated to: ${newName}`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      
      // Refresh the list
      await this.scanProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      const toast = await this.toastController.create({
        message: '❌ Failed to update product',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  async deleteProduct(issue: ProductNameIssue) {
    const alert = await this.alertController.create({
      header: 'Delete Product?',
      message: `Are you sure you want to delete "${issue.currentName}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            // Add delete logic here if needed
            const toast = await this.toastController.create({
              message: 'Delete feature coming soon',
              duration: 2000,
              color: 'warning'
            });
            await toast.present();
          }
        }
      ]
    });

    await alert.present();
  }

  getSuggestedName(issue: ProductNameIssue): string {
    // Suggest a name based on category
    const suggestions: { [key: string]: string } = {
      'Food': 'Homemade Food',
      'Snacks': 'Snack Pack',
      'Books': 'Textbook',
      'Accessories': 'Accessory Item',
      'Electronics': 'Electronic Device',
      'Clothing': 'Clothing Item',
      'Other': 'Product Item'
    };
    return suggestions[issue.category] || 'Product';
  }
}
