import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface APIIntegration {
  name: string;
  baseUrl: string;
  apiKey?: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiIntegrationService {
  
  // Available API integrations for CampusMarket
  private integrations: { [key: string]: APIIntegration } = {
    // Payment Gateway - PayMongo (Philippine payment gateway)
    paymongo: {
      name: 'PayMongo',
      baseUrl: 'https://api.paymongo.com/v1',
      enabled: false // Set to true when API key is configured
    },
    
    // SMS Gateway - Semaphore (Philippine SMS service)
    semaphore: {
      name: 'Semaphore SMS',
      baseUrl: 'https://api.semaphore.co',
      enabled: false
    },
    
    // Email Service - SendGrid
    sendgrid: {
      name: 'SendGrid Email',
      baseUrl: 'https://api.sendgrid.com/v3',
      enabled: false
    },
    
    // Location/Maps - OpenStreetMap (Free alternative to Google Maps)
    openstreetmap: {
      name: 'OpenStreetMap',
      baseUrl: 'https://nominatim.openstreetmap.org',
      enabled: true // Free, no API key needed
    },
    
    // Currency Exchange - Free API
    exchangerate: {
      name: 'Exchange Rate API',
      baseUrl: 'https://api.exchangerate-api.com/v4',
      enabled: true // Free
    }
  };

  constructor(private http: HttpClient) {}

  // ============ PAYMENT INTEGRATIONS ============
  
  /**
   * Create PayMongo payment intent
   * Docs: https://developers.paymongo.com/reference/create-a-paymentintent
   */
  async createPaymentIntent(amount: number, description: string): Promise<any> {
    if (!this.integrations['paymongo'].enabled) {
      throw new Error('PayMongo integration is not enabled. Please configure API key.');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(this.integrations['paymongo'].apiKey + ':')}`
    });

    const payload = {
      data: {
        attributes: {
          amount: amount * 100, // Convert to centavos
          currency: 'PHP',
          description: description,
          payment_method_allowed: ['card', 'gcash', 'paymaya']
        }
      }
    };

    return firstValueFrom(
      this.http.post(`${this.integrations['paymongo'].baseUrl}/payment_intents`, payload, { headers })
    );
  }

  // ============ SMS NOTIFICATIONS ============
  
  /**
   * Send SMS notification via Semaphore
   * Docs: https://semaphore.co/docs
   */
  async sendSMS(phoneNumber: string, message: string): Promise<any> {
    if (!this.integrations['semaphore'].enabled) {
      console.warn('SMS integration not enabled');
      return null;
    }

    const payload = {
      apikey: this.integrations['semaphore'].apiKey,
      number: phoneNumber,
      message: message,
      sendername: 'CampusMkt'
    };

    return firstValueFrom(
      this.http.post(`${this.integrations['semaphore'].baseUrl}/api/v4/messages`, payload)
    );
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmationSMS(phoneNumber: string, orderId: string): Promise<void> {
    const message = `Your CampusMarket order #${orderId} has been confirmed! The seller will prepare your items.`;
    try {
      await this.sendSMS(phoneNumber, message);
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  }

  /**
   * Send order ready for pickup SMS
   */
  async sendOrderReadySMS(phoneNumber: string, orderId: string, pickupLocation: string): Promise<void> {
    const message = `Your order #${orderId} is ready for pickup at ${pickupLocation}. Thank you!`;
    try {
      await this.sendSMS(phoneNumber, message);
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  }

  // ============ EMAIL NOTIFICATIONS ============
  
  /**
   * Send email via SendGrid
   * Docs: https://docs.sendgrid.com/api-reference/mail-send/mail-send
   */
  async sendEmail(to: string, subject: string, htmlContent: string): Promise<any> {
    if (!this.integrations['sendgrid'].enabled) {
      console.warn('Email integration not enabled');
      return null;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.integrations['sendgrid'].apiKey}`
    });

    const payload = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@campusmarket.app', name: 'CampusMarket' },
      subject: subject,
      content: [{ type: 'text/html', value: htmlContent }]
    };

    return firstValueFrom(
      this.http.post(`${this.integrations['sendgrid'].baseUrl}/mail/send`, payload, { headers })
    );
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const htmlContent = `
      <h2>Welcome to CampusMarket, ${name}!</h2>
      <p>Thank you for joining our campus marketplace community.</p>
      <p>Start browsing products or apply to become a seller.</p>
      <p>Happy shopping!</p>
    `;
    try {
      await this.sendEmail(email, 'Welcome to CampusMarket', htmlContent);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }

  // ============ LOCATION/MAPS INTEGRATION ============
  
  /**
   * Geocode address using OpenStreetMap Nominatim
   * Free API, no key required
   */
  async geocodeAddress(address: string): Promise<any> {
    const params = {
      q: address,
      format: 'json',
      limit: '1'
    };

    const queryString = new URLSearchParams(params).toString();
    return firstValueFrom(
      this.http.get(`${this.integrations['openstreetmap'].baseUrl}/search?${queryString}`)
    );
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(lat: number, lon: number): Promise<any> {
    const params = {
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json'
    };

    const queryString = new URLSearchParams(params).toString();
    return firstValueFrom(
      this.http.get(`${this.integrations['openstreetmap'].baseUrl}/reverse?${queryString}`)
    );
  }

  // ============ CURRENCY/EXCHANGE RATE ============
  
  /**
   * Get current exchange rates (useful if expanding internationally)
   */
  async getExchangeRates(): Promise<any> {
    return firstValueFrom(
      this.http.get(`${this.integrations['exchangerate'].baseUrl}/latest/PHP`)
    );
  }

  // ============ ANALYTICS & REPORTING (Custom) ============
  
  /**
   * Send analytics event to external service
   */
  async trackEvent(eventName: string, properties: any): Promise<void> {
    // Integrate with analytics service like Mixpanel, Amplitude, etc.
    console.log('Analytics Event:', eventName, properties);
    // TODO: Implement analytics API call
  }

  /**
   * Track product view
   */
  async trackProductView(productId: string, userId: string): Promise<void> {
    await this.trackEvent('product_viewed', {
      product_id: productId,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track order placed
   */
  async trackOrderPlaced(orderId: string, totalAmount: number, userId: string): Promise<void> {
    await this.trackEvent('order_placed', {
      order_id: orderId,
      total_amount: totalAmount,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  // ============ CONFIGURATION ============
  
  /**
   * Configure API integration
   */
  configureIntegration(service: string, apiKey: string): void {
    if (this.integrations[service]) {
      this.integrations[service].apiKey = apiKey;
      this.integrations[service].enabled = true;
      console.log(`${service} integration enabled`);
    }
  }

  /**
   * Get integration status
   */
  getIntegrationStatus(service: string): APIIntegration | null {
    return this.integrations[service] || null;
  }

  /**
   * List all available integrations
   */
  getAllIntegrations(): { [key: string]: APIIntegration } {
    return this.integrations;
  }
}
