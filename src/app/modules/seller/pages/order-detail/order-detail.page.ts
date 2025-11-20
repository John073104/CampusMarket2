import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private chatService: ChatService,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController
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

  async updateStatus(newStatus: OrderStatus) {
    const alert = await this.alertController.create({
      header: 'Confirm Status Update',
      message: `Are you sure you want to change order status to "${newStatus}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm',
          handler: async () => {
            try {
              await this.orderService.updateOrderStatus(this.orderId, newStatus);
              const toast = await this.toastController.create({
                message: 'Order status updated successfully',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
              await this.loadOrder();
            } catch (error) {
              console.error('Error updating status:', error);
              const toast = await this.toastController.create({
                message: 'Failed to update order status',
                duration: 3000,
                color: 'danger'
              });
              await toast.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async messageCustomer() {
    if (!this.order) return;

    const user = this.authService.getCurrentUser();
    if (!user) return;

    try {
      const chatId = await this.chatService.getOrCreateChat(
        user.userId!,
        user.name || user.email,
        this.order.customerId,
        this.order.customerName
      );
      this.router.navigate([`/seller/chat/${chatId}`]);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  }

  getPaymentMethodLabel(method?: string): string {
    const labels: Record<string, string> = {
      'cod': 'Cash on Delivery',
      'gcash': 'GCash',
      'bank_transfer': 'Bank Transfer',
      'meet_and_pay': 'Meet & Pay'
    };
    return labels[method || 'cod'] || 'Cash on Delivery';
  }

  getPaymentStatusColor(status?: string): string {
    const colors: Record<string, string> = {
      'pending': 'warning',
      'verified': 'success',
      'rejected': 'danger'
    };
    return colors[status || 'pending'] || 'medium';
  }

  async viewPaymentProof(imageUrl: string) {
    const alert = await this.alertController.create({
      header: 'Payment Proof',
      message: `<img src="${imageUrl}" style="width: 100%; max-height: 400px; object-fit: contain;" />`,
      buttons: ['Close']
    });
    await alert.present();
  }

  async verifyPayment() {
    const alert = await this.alertController.create({
      header: 'Verify Payment',
      message: 'Confirm that you have received the payment?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Verify',
          handler: async () => {
            try {
              await this.orderService.verifyPayment(this.orderId);
              const toast = await this.toastController.create({
                message: 'Payment verified successfully!',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
              await this.loadOrder();
            } catch (error) {
              console.error('Error verifying payment:', error);
              const toast = await this.toastController.create({
                message: 'Failed to verify payment',
                duration: 3000,
                color: 'danger'
              });
              await toast.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async rejectPayment() {
    const alert = await this.alertController.create({
      header: 'Reject Payment',
      message: 'Why are you rejecting this payment proof?',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'e.g., Image unclear, wrong amount, invalid receipt...'
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          handler: async (data) => {
            if (!data.reason) {
              const toast = await this.toastController.create({
                message: 'Please provide a reason',
                duration: 2000,
                color: 'warning'
              });
              await toast.present();
              return false;
            }

            try {
              await this.orderService.rejectPayment(this.orderId, data.reason);
              const toast = await this.toastController.create({
                message: 'Payment rejected. Customer will be notified.',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
              await this.loadOrder();
            } catch (error) {
              console.error('Error rejecting payment:', error);
              const toast = await this.toastController.create({
                message: 'Failed to reject payment',
                duration: 3000,
                color: 'danger'
              });
              await toast.present();
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }
}


