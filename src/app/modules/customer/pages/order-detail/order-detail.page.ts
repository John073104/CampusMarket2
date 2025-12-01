import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from 'src/app/services/order.service';
import { ChatService } from 'src/app/services/chat.service';
import { AuthService } from 'src/app/services/auth.service';
import { Order, OrderStatus } from 'src/app/models/order.model';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.page.html',
  styleUrls: ['./order-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class OrderDetailPage implements OnInit {
  order: Order | null = null;
  loading = false;
  orderId = '';
  isEditing = false;
  editData = {
    pickupLocation: '',
    notes: '',
    items: [] as any[]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private chatService: ChatService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (this.orderId) {
      this.loadOrder();
    }
  }

  async loadOrder() {
    this.loading = true;
    try {
      this.order = await this.orderService.getOrderById(this.orderId);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      this.loading = false;
    }
  }

  getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      'placed': 'warning',
      'confirmed': 'primary',
      'ready_for_pickup': 'secondary',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return colors[status] || 'medium';
  }

  async messageSeller() {
    if (!this.order) return;

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    try {
      const chatId = await this.chatService.getOrCreateChat(
        user.userId!,
        user.name || user.email,
        this.order.sellerId,
        this.order.sellerName
      );
      this.router.navigate([`/customer/chat/${chatId}`]);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  }

  canCancelOrder(): boolean {
    return this.order?.status === 'placed' || this.order?.status === 'confirmed';
  }

  canEditOrder(): boolean {
    return this.order?.status === 'placed';
  }

  async cancelOrder() {
    if (!this.order) return;

    const alert = await this.alertController.create({
      header: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? This action cannot be undone.',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes, Cancel Order',
          role: 'destructive',
          handler: async () => {
            await this.performCancelOrder();
          }
        }
      ]
    });

    await alert.present();
  }

  async performCancelOrder() {
    if (!this.order?.orderId) return;

    this.loading = true;
    try {
      await this.orderService.cancelOrder(this.order.orderId);
      
      const toast = await this.toastController.create({
        message: 'Order cancelled successfully',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
      
      // Reload order to show updated status
      await this.loadOrder();
    } catch (error) {
      console.error('Error cancelling order:', error);
      const toast = await this.toastController.create({
        message: 'Failed to cancel order. Please try again.',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  startEditOrder() {
    if (!this.order) return;
    
    this.isEditing = true;
    this.editData = {
      pickupLocation: this.order.pickupLocation || '',
      notes: this.order.notes || '',
      items: JSON.parse(JSON.stringify(this.order.items)) // Deep copy items
    };
  }
  
  updateItemQuantity(index: number, change: number) {
    if (!this.editData.items[index]) return;
    
    const newQty = this.editData.items[index].quantity + change;
    if (newQty > 0) {
      this.editData.items[index].quantity = newQty;
    }
  }
  
  removeItem(index: number) {
    this.editData.items.splice(index, 1);
  }
  
  getEditTotal(): number {
    return this.editData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  cancelEdit() {
    this.isEditing = false;
  }

  async saveOrderChanges() {
    if (!this.order?.orderId) return;
    
    if (this.editData.items.length === 0) {
      const toast = await this.toastController.create({
        message: 'Order must have at least one item',
        duration: 2000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }

    this.loading = true;
    try {
      const newTotal = this.getEditTotal();
      
      await this.orderService.updateOrderDetails(this.order.orderId, {
        pickupLocation: this.editData.pickupLocation,
        notes: this.editData.notes,
        items: this.editData.items,
        totalPrice: newTotal
      });
      
      const toast = await this.toastController.create({
        message: 'Order updated successfully',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
      
      this.isEditing = false;
      await this.loadOrder();
    } catch (error) {
      console.error('Error updating order:', error);
      const toast = await this.toastController.create({
        message: 'Failed to update order. Please try again.',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }
}


