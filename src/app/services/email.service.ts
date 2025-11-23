import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  // EmailJS Configuration
  // Sign up at https://www.emailjs.com/ and get your credentials
  private serviceId = 'service_jyyi7e2'; // Replace with your EmailJS service ID
  private templateId = 'template_96rsgmv'; // Replace with your EmailJS template ID
  private publicKey = '889ioeKjOwcpQ-K7F'; // Replacewith your EmailJS public key

  constructor() {
    // Initialize EmailJS with your public key
    emailjs.init(this.publicKey);
  }

  /**
   * Send order receipt email to customer
   * @param orderData Order details
   * @returns Promise<boolean>
   */
  async sendOrderReceipt(orderData: {
    customerEmail: string;
    customerName: string;
    orderId: string;
    items: Array<{ productName: string; quantity: number; price: number }>;
    totalAmount: number;
    orderDate: string;
    paymentMethod: string;
    deliveryAddress: string;
  }): Promise<boolean> {
    try {
      // Create items list for email
      const itemsList = orderData.items
        .map(item => `${item.productName} (x${item.quantity}) - ₱${item.price.toFixed(2)}`)
        .join('\n');

      const templateParams = {
        to_email: orderData.customerEmail,
        to_name: orderData.customerName,
        order_id: orderData.orderId,
        order_date: orderData.orderDate,
        items_list: itemsList,
        total_amount: `₱${orderData.totalAmount.toFixed(2)}`,
        payment_method: orderData.paymentMethod,
        delivery_address: orderData.deliveryAddress,
        subject: `Order Confirmation - ${orderData.orderId}`
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

      console.log('Email sent successfully:', response);
      return response.status === 200;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send order status update email
   * @param email Customer email
   * @param name Customer name
   * @param orderId Order ID
   * @param status New order status
   * @returns Promise<boolean>
   */
  async sendOrderStatusUpdate(
    email: string,
    name: string,
    orderId: string,
    status: string
  ): Promise<boolean> {
    try {
      const templateParams = {
        to_email: email,
        to_name: name,
        order_id: orderId,
        order_status: status,
        subject: `Order ${orderId} - Status Update`
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

      return response.status === 200;
    } catch (error) {
      console.error('Error sending status update email:', error);
      return false;
    }
  }

  /**
   * Test email configuration
   * @returns Promise<boolean>
   */
  async testEmailConfiguration(): Promise<boolean> {
    try {
      const testParams = {
        to_email: 'test@example.com',
        to_name: 'Test User',
        subject: 'EmailJS Configuration Test',
        message: 'If you receive this, EmailJS is configured correctly!'
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        testParams
      );

      return response.status === 200;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}
