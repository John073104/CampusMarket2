# CampusMarket API Integration Guide

## Overview
CampusMarket now includes a comprehensive API integration system that supports payment gateways, SMS notifications, email services, location services, and analytics.

## 🔧 Setup Instructions

### 1. Import the Service
```typescript
import { ApiIntegrationService } from './services/api-integration.service';

constructor(private apiService: ApiIntegrationService) {}
```

### 2. Configure API Keys
```typescript
// In your component or service initialization
this.apiService.configureIntegration('paymongo', 'pk_test_YOUR_API_KEY');
this.apiService.configureIntegration('semaphore', 'YOUR_SEMAPHORE_API_KEY');
this.apiService.configureIntegration('sendgrid', 'YOUR_SENDGRID_API_KEY');
```

## 📦 Available Integrations

### 1. PayMongo (Payment Gateway) 🇵🇭
**Status:** Ready to configure  
**Cost:** Transaction fees apply  
**Signup:** https://developers.paymongo.com/

**Features:**
- Credit/Debit card payments
- GCash integration
- PayMaya integration
- PHP currency support

**Usage:**
```typescript
// Create payment intent
const payment = await this.apiService.createPaymentIntent(500, 'Order #12345');
```

**Configuration Steps:**
1. Sign up at paymongo.com
2. Get API keys from dashboard
3. Configure: `apiService.configureIntegration('paymongo', 'YOUR_KEY')`

---

### 2. Semaphore SMS Gateway 🇵🇭
**Status:** Ready to configure  
**Cost:** Pay-per-SMS  
**Signup:** https://semaphore.co/

**Features:**
- Order confirmations
- Pickup notifications
- OTP verification
- Philippine mobile numbers

**Usage:**
```typescript
// Send order confirmation
await this.apiService.sendOrderConfirmationSMS('+639123456789', 'ORD-001');

// Send pickup notification
await this.apiService.sendOrderReadySMS('+639123456789', 'ORD-001', 'Building A');
```

**Configuration Steps:**
1. Sign up at semaphore.co
2. Purchase SMS credits
3. Get API key from dashboard
4. Configure: `apiService.configureIntegration('semaphore', 'YOUR_KEY')`

---

### 3. SendGrid (Email Service) 📧
**Status:** Ready to configure  
**Cost:** Free tier available (100 emails/day)  
**Signup:** https://sendgrid.com/

**Features:**
- Welcome emails
- Order notifications
- Password reset emails
- Marketing campaigns

**Usage:**
```typescript
// Send welcome email
await this.apiService.sendWelcomeEmail('user@email.com', 'John');

// Custom email
await this.apiService.sendEmail(
  'user@email.com',
  'Your Order is Ready',
  '<h1>Order Ready!</h1><p>Pick up your order now.</p>'
);
```

**Configuration Steps:**
1. Sign up at sendgrid.com
2. Verify sender email
3. Create API key
4. Configure: `apiService.configureIntegration('sendgrid', 'YOUR_KEY')`

---

### 4. OpenStreetMap (Location Services) 🗺️
**Status:** ✅ ACTIVE (No API key needed)  
**Cost:** FREE  
**Docs:** https://nominatim.org/

**Features:**
- Address geocoding
- Reverse geocoding
- Location search
- No API key required

**Usage:**
```typescript
// Get coordinates from address
const location = await this.apiService.geocodeAddress('University of the Philippines Diliman');

// Get address from coordinates
const address = await this.apiService.reverseGeocode(14.6542, 121.0681);
```

---

### 5. Exchange Rate API 💱
**Status:** ✅ ACTIVE (No API key needed)  
**Cost:** FREE  
**Docs:** https://exchangerate-api.com/

**Features:**
- Real-time currency conversion
- PHP base currency
- Multiple currency support

**Usage:**
```typescript
// Get current exchange rates
const rates = await this.apiService.getExchangeRates();
console.log(rates.rates.USD); // PHP to USD conversion
```

---

## 🔔 Built-in Notification System

### Database: Firestore Collection `notifications`
The app automatically sends in-app notifications for:

1. **Product Submissions** → Notifies admins
2. **Product Approvals** → Notifies sellers
3. **New Orders** → Notifies sellers
4. **Order Status Changes** → Notifies customers
5. **Seller Application Status** → Notifies applicants

### Usage in Services:
```typescript
// Already integrated in:
- ProductService.createProduct() → Notifies admins
- ProductService.approveProduct() → Notifies sellers
- OrderService.createOrder() → Notifies sellers
- OrderService.updateOrderStatus() → Notifies customers
```

---

## 📊 Analytics Integration

### Track Events
```typescript
// Product views
await this.apiService.trackProductView('product-123', 'user-456');

// Orders
await this.apiService.trackOrderPlaced('order-789', 500, 'user-456');

// Custom events
await this.apiService.trackEvent('user_signup', { 
  user_id: '123', 
  role: 'customer' 
});
```

---

## 🚀 Quick Start Implementation

### Example: Order Confirmation with SMS
```typescript
async confirmOrder(orderId: string, customerPhone: string) {
  // 1. Update order status
  await this.orderService.updateOrderStatus(orderId, 'confirmed');
  
  // 2. Send in-app notification (automatic)
  // Already handled by orderService
  
  // 3. Send SMS notification (if configured)
  await this.apiService.sendOrderConfirmationSMS(customerPhone, orderId);
  
  // 4. Track analytics
  await this.apiService.trackEvent('order_confirmed', { order_id: orderId });
}
```

### Example: Product Approval with Email
```typescript
async approveProduct(productId: string) {
  // 1. Approve in database
  await this.productService.approveProduct(productId);
  
  // 2. In-app notification sent automatically
  
  // 3. Optional: Send email to seller
  const product = await this.productService.getProductById(productId);
  await this.apiService.sendEmail(
    product.sellerEmail,
    'Product Approved!',
    `<p>Your product "${product.title}" is now live on CampusMarket!</p>`
  );
}
```

---

## 💡 Recommended Setup Priority

1. **Start Here (FREE & Active):**
   - ✅ OpenStreetMap - Already working
   - ✅ Exchange Rate API - Already working
   - ✅ In-app notifications - Already working

2. **Next (High Value):**
   - 📧 SendGrid - Free tier for emails
   - 💳 PayMongo - Essential for online payments

3. **Optional (Later):**
   - 📱 Semaphore SMS - For premium experience

---

## 🔐 Security Best Practices

1. **Never commit API keys to Git**
   - Store in `environment.ts` (already gitignored)
   - Use environment variables in production

2. **Example `environment.ts`:**
```typescript
export const environment = {
  production: false,
  firebaseConfig: { ... },
  apiKeys: {
    paymongo: 'pk_test_YOUR_KEY',
    semaphore: 'YOUR_KEY',
    sendgrid: 'YOUR_KEY'
  }
};
```

3. **Initialize in AppComponent:**
```typescript
ngOnInit() {
  if (environment.apiKeys.paymongo) {
    this.apiService.configureIntegration('paymongo', environment.apiKeys.paymongo);
  }
  // Repeat for other services
}
```

---

## 📝 Testing

### Test SMS Integration (Sandbox Mode)
```typescript
// Use test numbers provided by Semaphore
await this.apiService.sendSMS('+639000000000', 'Test message');
```

### Test Payment Integration (Test Mode)
```typescript
// Use PayMongo test cards
// Card Number: 4343434343434345
// Expiry: Any future date
// CVC: Any 3 digits
```

---

## 🆘 Support & Documentation

- **PayMongo:** https://developers.paymongo.com/docs
- **Semaphore:** https://semaphore.co/docs
- **SendGrid:** https://docs.sendgrid.com/
- **OpenStreetMap:** https://nominatim.org/release-docs/latest/
- **Exchange Rate API:** https://www.exchangerate-api.com/docs

---

## 📈 Current Implementation Status

✅ **Completed:**
- API Integration Service created
- Notification system active (Firestore-based)
- Product approval notifications working
- Order status notifications working
- HttpClient configured in app.module
- Base64 image storage (fast, no external storage needed)

⏳ **Ready to Configure:**
- PayMongo payment gateway
- Semaphore SMS notifications
- SendGrid email service

🎯 **Immediate Benefits:**
- Faster product uploads (images stored in Firestore as base64)
- Real-time admin notifications for pending products
- Seller notifications when products approved
- Customer notifications for order updates
- Free location services available now

---

**Last Updated:** Phase 4 Implementation  
**Version:** 1.0.0
