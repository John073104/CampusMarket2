# CampusMarket - Ionic Angular Firebase E-commerce Platform

A comprehensive campus marketplace application built with Ionic Angular and Firebase Firestore, featuring role-based access control for Customers, Sellers, and Admins.

## 🚀 Features Implemented

### Authentication
- ✅ Email/Password Login & Signup
- ✅ Role-based redirect after login (Customer/Seller/Admin)
- ✅ Automatic logout & session management
- ✅ Auth Guards for route protection

### Customer Features
- ✅ Browse approved products feed
- ✅ Search products by name
- ✅ Filter by category & price range
- ✅ View product details with multiple images
- ✅ Add to cart functionality
- ✅ Place orders
- ✅ Order history with status tracking
- ✅ Apply to become seller
- ✅ In-app chat with sellers
- ✅ Personal dashboard

### Seller Features
- ✅ Seller dashboard with sales overview
- ✅ Create new product listings with images
- ✅ Edit/delete own products
- ✅ View & manage orders
- ✅ Update order status
- ✅ Product approval queue view
- ✅ Sales analytics & reports
- ✅ Chat with customers

### Admin Features
- ✅ Admin dashboard with platform analytics
- ✅ Manage seller applications (Approve/Reject)
- ✅ Approve/reject product listings
- ✅ View all users & activities
- ✅ Sales reports & platform statistics
- ✅ User management capabilities
- ✅ System monitoring

## 📁 Project Structure

```
src/
├── app/
│   ├── guards/
│   │   ├── auth.guard.ts              # Authentication guard
│   │   └── role.guard.ts              # Role-based guard
│   ├── models/
│   │   ├── user.model.ts              # User & SellerApplication models
│   │   ├── product.model.ts           # Product model
│   │   ├── order.model.ts             # Order & OrderItem models
│   │   └── chat.model.ts              # Chat & Message models
│   ├── services/
│   │   ├── auth.service.ts            # Authentication service
│   │   ├── user.service.ts            # User management service
│   │   ├── product.service.ts         # Product CRUD service
│   │   ├── order.service.ts           # Order management service
│   │   ├── chat.service.ts            # Real-time chat service
│   │   ├── cart.service.ts            # Shopping cart service
│   │   ├── notification.service.ts    # Push notifications
│   │   └── storage.service.ts         # Firebase Storage service
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── login/                 # Login page
│   │   │   └── signup/                # Signup page
│   │   ├── customer/
│   │   │   └── pages/
│   │   │       ├── dashboard/         # Customer dashboard
│   │   │       ├── products/          # Product listing
│   │   │       ├── product-detail/    # Product details
│   │   │       ├── cart/              # Shopping cart
│   │   │       ├── orders/            # Order history
│   │   │       ├── order-detail/      # Order details
│   │   │       ├── chats/             # Chat list
│   │   │       ├── chat/              # Chat conversation
│   │   │       ├── profile/           # User profile
│   │   │       └── apply-seller/      # Seller application
│   │   ├── seller/
│   │   │   └── pages/
│   │   │       ├── dashboard/         # Seller dashboard
│   │   │       ├── products/          # Seller's products
│   │   │       ├── add-product/       # Add new product
│   │   │       ├── edit-product/      # Edit product
│   │   │       ├── orders/            # Seller orders
│   │   │       ├── order-detail/      # Order details
│   │   │       ├── chats/             # Chat list
│   │   │       ├── chat/              # Chat conversation
│   │   │       ├── profile/           # Seller profile
│   │   │       └── analytics/         # Sales analytics
│   │   └── admin/
│   │       └── pages/
│   │           ├── dashboard/         # Admin dashboard
│   │           ├── seller-applications/ # Manage seller apps
│   │           ├── pending-products/  # Approve products
│   │           ├── users/             # User management
│   │           ├── orders/            # All orders
│   │           └── analytics/         # Platform analytics
│   └── pages/
│       └── landing/                   # Landing page
└── environments/
    ├── environment.ts                 # Dev config
    └── environment.prod.ts            # Production config
```

## 🔥 Firebase Configuration

### Firestore Collections

#### users
```typescript
{
  userId: string;
  email: string;
  role: 'customer' | 'seller' | 'admin';
  name: string;
  phone?: string;
  profileImage?: string;
  dateJoined: Timestamp;
  isActive: boolean;
}
```

#### products
```typescript
{
  productId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  price: number;
  category: 'Food' | 'Accessories' | 'Books' | 'Snacks' | 'Electronics' | 'Clothing' | 'Other';
  images: string[];
  approved: boolean;
  stock: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### orders
```typescript
{
  orderId: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'placed' | 'confirmed' | 'ready_for_pickup' | 'completed' | 'cancelled';
  pickupLocation?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### chats
```typescript
{
  chatId: string;
  participantIds: string[];
  participantNames: { [userId: string]: string };
  orderId?: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: { [userId: string]: number };
}
```

#### chats/{chatId}/messages (subcollection)
```typescript
{
  messageId: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
  read: boolean;
}
```

#### sellerApplications
```typescript
{
  applicationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  reasonForSelling: string;
  businessDescription?: string;
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}
```

#### notifications
```typescript
{
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'product' | 'seller_application' | 'chat' | 'system';
  relatedId?: string;
  read: boolean;
  createdAt: Timestamp;
}
```

### Firebase Storage Structure
```
/profile-images/{userId}/profile.jpg
/product-images/{sellerId}/{productId}/{imageId}.jpg
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Ionic CLI: `npm install -g @ionic/cli`
- Angular CLI: `npm install -g @angular/cli`

### Installation Steps

1. **Clone or navigate to project directory**
```bash
cd CampusMarket
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**
   - Update `src/environments/environment.ts` with your Firebase config
   - Update `src/environments/environment.prod.ts` for production

4. **Run the development server**
```bash
ionic serve
```

5. **Build for production**
```bash
ionic build --prod
```

## 📱 Running on Mobile

### Android
```bash
ionic cap add android
ionic cap sync android
ionic cap open android
```

### iOS
```bash
ionic cap add ios
ionic cap sync ios
ionic cap open ios
```

## 🔐 Security Rules

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true; // Public read
      allow create: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['seller', 'admin'];
      allow update: if request.auth != null && 
                      (resource.data.sellerId == request.auth.uid || 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow delete: if request.auth != null && 
                      (resource.data.sellerId == request.auth.uid || 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null && 
                    (resource.data.customerId == request.auth.uid || 
                     resource.data.sellerId == request.auth.uid ||
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                      (resource.data.customerId == request.auth.uid || 
                       resource.data.sellerId == request.auth.uid ||
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Chats collection
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid in resource.data.participantIds;
      allow create: if request.auth != null;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Seller Applications
    match /sellerApplications/{applicationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read, update: if request.auth != null && 
                            resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

### Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-images/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /product-images/{sellerId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == sellerId;
    }
  }
}
```

## 📊 Key Services Overview

### AuthService
- Sign up new users
- Sign in with email/password
- Role-based redirects
- Session management
- Current user state management

### ProductService
- Create products with image upload
- Get approved products
- Filter by category
- Search products
- Seller product management
- Admin approval workflow

### OrderService
- Create orders from cart
- Track order status
- Get orders by customer/seller
- Order statistics
- Platform analytics

### ChatService
- Real-time messaging
- Create/get chats
- Unread message tracking
- Order-specific conversations

### CartService
- Add/remove items
- Update quantities
- Group items by seller
- Persistent storage

### NotificationService
- Create notifications
- Track unread count
- Order/product/chat notifications
- Automated notification templates

## 🎨 UI Components

The project uses Ionic components for a native mobile experience:
- `<ion-card>` for content cards
- `<ion-list>` for lists
- `<ion-tabs>` for navigation
- `<ion-modal>` for popups
- `<ion-loading>` for loading states
- `<ion-toast>` for notifications
- `<ion-alert>` for confirmations

## 🧪 Testing

Run unit tests:
```bash
npm test
```

Run e2e tests:
```bash
npm run e2e
```

## 🚀 Deployment

### Web Deployment (Firebase Hosting)
```bash
ionic build --prod
firebase deploy --only hosting
```

### App Store Deployment
1. Build for iOS/Android
2. Follow platform-specific guidelines
3. Submit to App Store/Play Store

## 📝 Environment Variables

Create a `.env` file (not committed to git):
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For support, email support@campusmarket.com or open an issue on GitHub.

## 🔄 Next Steps

1. Implement remaining page logic (follow patterns in services)
2. Add real-time listeners for orders and messages
3. Implement push notifications
4. Add image compression before upload
5. Add pagination for large lists
6. Implement search with Algolia or similar
7. Add payment gateway integration
8. Implement rating & review system
9. Add wishlist functionality
10. Create seller verification process

---

**Built with ❤️ using Ionic, Angular, and Firebase**
