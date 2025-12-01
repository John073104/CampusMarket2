# CampusMarket - Complete Features & Defense Questions

## 📋 SYSTEM OVERVIEW
**Project Name:** CampusMarket  
**Technology Stack:** Ionic 8, Angular, Firebase (Firestore, Authentication, Storage)  
**Architecture:** Role-Based Access Control (RBAC) - 3 Roles  
**Platform:** Cross-platform (Web, iOS, Android via Capacitor)

---

## 🎯 FEATURES BY ROLE

### 👤 CUSTOMER FEATURES

#### 1. **Authentication & Profile**
- ✅ Email/Password Registration
- ✅ Email/Password Login
- ✅ Profile Management (Name, Phone, Profile Picture)
- ✅ Secure Session Management
- ✅ Password Reset

#### 2. **Product Browsing**
- ✅ View All Approved Products Feed
- ✅ Search Products by Name
- ✅ Filter by Category (Electronics, Books, Clothing, etc.)
- ✅ Filter by Price Range (Min/Max)
- ✅ View Product Details (Images, Description, Price, Stock)
- ✅ Multiple Product Images Gallery

#### 3. **Shopping Cart**
- ✅ Add Products to Cart
- ✅ View Cart Items
- ✅ Update Quantities
- ✅ Remove Items from Cart
- ✅ Real-time Price Calculation
- ✅ Cart Persistence

#### 4. **Order Management**
- ✅ Place Orders (COD, GCash, Bank Transfer)
- ✅ View Order History
- ✅ Track Order Status (Placed → Confirmed → Ready → Completed)
- ✅ View Order Details
- ✅ Order Item Breakdown
- ✅ Cancel Orders (if not confirmed)

#### 5. **Messaging**
- ✅ Real-time Chat with Sellers
- ✅ Order-based Chat Initiation
- ✅ Unread Message Badges
- ✅ Message History
- ✅ Chat Notifications

#### 6. **Seller Application**
- ✅ Apply to Become Seller
- ✅ Application Status Tracking
- ✅ Business Information Submission

#### 7. **Dashboard**
- ✅ Total Orders Count
- ✅ Recent Orders
- ✅ Quick Actions (Browse, Cart, Orders, Apply Seller)

---

### 🏪 SELLER FEATURES

#### 1. **Seller Dashboard**
- ✅ Total Products Count
- ✅ Pending Products Count
- ✅ Total Orders Count
- ✅ Total Sales Amount
- ✅ Sales Statistics
- ✅ Quick Action Cards

#### 2. **Product Management**
- ✅ Create New Products
- ✅ Upload Multiple Product Images
- ✅ Set Product Details (Name, Price, Stock, Category, Description)
- ✅ Edit Own Products
- ✅ Delete Own Products
- ✅ View Product Approval Status
- ✅ Track Pending Products

#### 3. **Order Management**
- ✅ View All Orders for My Products
- ✅ Filter Orders by Status
- ✅ Update Order Status (Confirm, Ready, Complete)
- ✅ View Order Details
- ✅ Customer Information Access
- ✅ Order Item Breakdown

#### 4. **Messaging**
- ✅ Real-time Chat with Customers
- ✅ Order Context in Chat
- ✅ Unread Message Badges
- ✅ Respond to Customer Inquiries
- ✅ Chat History

#### 5. **Sales Reports**
- ✅ Sales Over Time Chart (Line)
- ✅ Products by Category Chart (Pie)
- ✅ Sales Analytics
- ✅ Export PDF Reports
- ✅ Print Reports
- ✅ Date Range Filtering

#### 6. **Profile Management**
- ✅ Edit Seller Profile
- ✅ Business Information
- ✅ Contact Details
- ✅ Profile Picture Update

---

### 👨‍💼 ADMIN FEATURES

#### 1. **Admin Dashboard**
- ✅ Platform Overview
- ✅ Total Users Count
- ✅ Total Products Count
- ✅ Pending Products Badge
- ✅ Pending Seller Applications Badge
- ✅ Total Orders Count
- ✅ Total Sales Amount
- ✅ Quick Action Cards
- ✅ System Statistics

#### 2. **User Management**
- ✅ View All Users (Customers, Sellers, Admins)
- ✅ Filter by Role
- ✅ Search Users
- ✅ View User Details
- ✅ User Activity Tracking
- ✅ Role-based User Lists

#### 3. **Seller Application Management**
- ✅ View Pending Applications
- ✅ View All Applications
- ✅ Approve Seller Applications
- ✅ Reject Seller Applications
- ✅ Application Status Tracking
- ✅ Applicant Details Review

#### 4. **Product Approval**
- ✅ View Pending Products
- ✅ Review Product Details
- ✅ Approve Products
- ✅ Reject Products
- ✅ Product Image Gallery Review
- ✅ Quality Control

#### 5. **Order Monitoring**
- ✅ View All Platform Orders
- ✅ Filter by Status
- ✅ Order Details Access
- ✅ Sales Tracking
- ✅ Order Analytics

#### 6. **Reports & Analytics**
- ✅ Sales Over Time Chart (Line)
- ✅ Products by Category Chart (Pie)
- ✅ Top 10 Sellers Chart (Bar)
- ✅ Order Status Breakdown (Doughnut)
- ✅ Platform Statistics
- ✅ Export PDF Reports
- ✅ Print Reports
- ✅ Date Range Filtering
- ✅ Real-time Chart Rendering

#### 7. **Admin Messaging**
- ✅ View All Platform Chats (Admin's Own)
- ✅ Monitor User Communications
- ✅ Chat History Access

#### 8. **Admin Profile**
- ✅ Edit Admin Profile
- ✅ Contact Information
- ✅ Profile Picture Update

#### 9. **Product Data Management**
- ✅ Fix Product Names Utility
- ✅ Data Quality Tools
- ✅ Bulk Product Updates

---

## 🔧 FIREBASE APIs & SERVICES USED

### 1. **Firebase Authentication API**
```typescript
@angular/fire/auth
```
- `createUserWithEmailAndPassword()` - User registration
- `signInWithEmailAndPassword()` - User login
- `signOut()` - User logout
- `onAuthStateChanged()` - Auth state monitoring
- `sendPasswordResetEmail()` - Password recovery

**Collections:** None (managed by Firebase Auth)

---

### 2. **Firebase Firestore Database API**
```typescript
@angular/fire/firestore
```

#### **Collections & Operations:**

**a) users Collection**
- `setDoc()` - Create user profile
- `getDoc()` - Get user by ID
- `getDocs()` - Get all users
- `updateDoc()` - Update user profile
- `query()` + `where()` - Filter users by role
- `serverTimestamp()` - Track timestamps

**b) products Collection**
- `addDoc()` - Create new product
- `getDoc()` - Get product details
- `getDocs()` - Get all products
- `updateDoc()` - Update product
- `deleteDoc()` - Delete product
- `query()` + `where()` - Filter by seller, status, category
- `orderBy()` - Sort products

**c) orders Collection**
- `addDoc()` - Create order
- `getDoc()` - Get order details
- `getDocs()` - Get all orders
- `updateDoc()` - Update order status
- `query()` + `where()` - Filter by user, seller, status
- `increment()` - Update quantities
- `arrayUnion()` - Add items

**d) chats Collection**
- `addDoc()` - Create chat
- `getDoc()` - Get chat details
- `getDocs()` - Get user chats
- `updateDoc()` - Update chat metadata
- `query()` + `where()` - Filter chats
- `onSnapshot()` - Real-time chat updates

**e) chats/{chatId}/messages Subcollection**
- `addDoc()` - Send message
- `getDocs()` - Get message history
- `updateDoc()` - Mark as read
- `query()` + `orderBy()` - Sort messages
- `onSnapshot()` - Real-time messages

**f) sellerApplications Collection**
- `addDoc()` - Submit application
- `getDocs()` - Get applications
- `updateDoc()` - Approve/reject application
- `query()` + `where()` - Filter by status

---

### 3. **Firebase Storage API**
```typescript
@angular/fire/storage
```
- `ref()` - Create storage reference
- `uploadBytes()` - Upload images
- `getDownloadURL()` - Get image URLs
- `deleteObject()` - Delete images

**Paths Used:**
- `/products/{productId}/{imageFile}` - Product images
- `/users/{userId}/{imageFile}` - Profile pictures

---

### 4. **Additional Services**

**a) Cart Service (Local Storage)**
- `localStorage.setItem()` - Save cart
- `localStorage.getItem()` - Load cart
- `localStorage.removeItem()` - Clear cart

**b) Notification Service**
- In-app notifications
- Unread count tracking
- Toast messages

---

## 📊 DATABASE STRUCTURE

```
Firestore Database:
├── users/
│   └── {userId}
│       ├── userId: string
│       ├── email: string
│       ├── name: string
│       ├── role: 'customer' | 'seller' | 'admin'
│       ├── phone?: string
│       ├── profilePicture?: string
│       ├── isActive: boolean
│       ├── dateJoined: timestamp
│       └── updatedAt?: timestamp
│
├── products/
│   └── {productId}
│       ├── productId: string
│       ├── name: string
│       ├── description: string
│       ├── price: number
│       ├── stock: number
│       ├── category: string
│       ├── sellerId: string
│       ├── sellerName: string
│       ├── images: string[]
│       ├── status: 'pending' | 'approved' | 'rejected'
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── orders/
│   └── {orderId}
│       ├── orderId: string
│       ├── customerId: string
│       ├── customerName: string
│       ├── sellerId: string
│       ├── sellerName: string
│       ├── items: [{productId, productName, quantity, price}]
│       ├── totalPrice: number
│       ├── status: 'placed' | 'confirmed' | 'ready_for_pickup' | 'completed' | 'cancelled'
│       ├── paymentMethod: 'cod' | 'gcash' | 'bank_transfer'
│       ├── deliveryAddress: string
│       ├── contactNumber: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── chats/
│   └── {chatId}
│       ├── chatId: string
│       ├── participantIds: [userId1, userId2]
│       ├── participantNames: {userId: name}
│       ├── orderId?: string
│       ├── lastMessage: string
│       ├── lastMessageTime: timestamp
│       ├── unreadCount: {userId: count}
│       └── messages/
│           └── {messageId}
│               ├── senderId: string
│               ├── senderName: string
│               ├── text: string
│               ├── timestamp: timestamp
│               └── read: boolean
│
└── sellerApplications/
    └── {applicationId}
        ├── userId: string
        ├── userName: string
        ├── userEmail: string
        ├── businessName: string
        ├── businessDescription: string
        ├── status: 'pending' | 'approved' | 'rejected'
        ├── createdAt: timestamp
        └── reviewedAt?: timestamp
```

---

## 🎓 DEFENSE QUESTIONS & ANSWERS

### **1. General System Questions**

**Q: What is your capstone project about?**  
A: CampusMarket is a comprehensive e-commerce platform designed specifically for campus communities. It enables students to buy and sell products within their campus, featuring role-based access control with three user types: Customers (buyers), Sellers (merchants), and Admins (platform managers). The system includes real-time messaging, order tracking, payment options, and analytics dashboards.

**Q: What technologies did you use and why?**  
A: We used:
- **Ionic 8 + Angular** - Cross-platform development (Web, iOS, Android) with single codebase
- **Firebase Firestore** - Real-time NoSQL database for scalability and offline support
- **Firebase Authentication** - Secure email/password authentication
- **Firebase Storage** - Cloud storage for product images and profile pictures
- **Chart.js** - Data visualization for reports and analytics
- **RxJS** - Reactive programming for real-time updates
- **TypeScript** - Type safety and better code quality

**Q: What design pattern did you use?**  
A: We implemented:
- **MVC (Model-View-Controller)** - Separation of concerns
- **Service-Oriented Architecture** - Reusable business logic in services
- **Observable Pattern** - Real-time data updates using RxJS
- **Role-Based Access Control (RBAC)** - Security and authorization
- **Modular Architecture** - Separate modules for each role

---

### **2. Technical Architecture Questions**

**Q: How does your authentication system work?**  
A: 
1. User enters email/password
2. Firebase Authentication validates credentials
3. On success, user data is fetched from Firestore `users` collection
4. User object is stored in BehaviorSubject and localStorage
5. Auth Guard protects routes based on user role
6. Session persists until logout or token expiration

**Q: How do you handle role-based access?**  
A: 
- Auth Guard checks user role before route activation
- Routes are configured with required roles metadata
- User is redirected to appropriate dashboard based on role
- Each role has separate routing module (customer, seller, admin)
- UI components conditionally render based on role

**Q: Explain your database structure.**  
A: We use Firestore with 6 main collections:
1. **users** - User profiles with role field
2. **products** - Product listings with seller reference
3. **orders** - Order transactions with status tracking
4. **chats** - Chat rooms with participant IDs
5. **messages** - Subcollection under chats for chat history
6. **sellerApplications** - Seller approval requests

Relations are maintained through ID references (userId, sellerId, productId, etc.)

---

### **3. Feature Implementation Questions**

**Q: How does the real-time chat work?**  
A: 
1. Chat created/retrieved using `getOrCreateChat()`
2. Firestore `onSnapshot()` listens for new messages
3. Messages stored in subcollection: `chats/{chatId}/messages`
4. Unread counts tracked per user in chat document
5. RxJS Observable emits updates to UI components
6. Read receipts updated when user views chat

**Q: How do you handle image uploads?**  
A:
1. User selects image from device
2. File converted to Blob
3. Uploaded to Firebase Storage: `products/{productId}/{filename}`
4. `getDownloadURL()` returns public URL
5. URL stored in Firestore product document
6. Multiple images stored as string array

**Q: Explain the order workflow.**  
A:
1. **Placed** - Customer creates order from cart
2. **Confirmed** - Seller confirms order
3. **Ready for Pickup** - Seller marks ready
4. **Completed** - Seller completes after delivery
5. **Cancelled** - Either party can cancel (if not confirmed)

Status updates trigger notifications and UI changes.

**Q: How do charts/reports work?**  
A:
1. Fetch data from Firestore (orders, products, users)
2. Process data into chart-ready format
3. Use Chart.js with canvas element
4. Create charts in `ngAfterViewInit()` lifecycle
5. Charts are responsive and update on data refresh
6. PDF export using jsPDF + html2canvas

---

### **4. Security & Data Management Questions**

**Q: How do you secure your application?**  
A:
- Firebase Auth for authentication
- Auth Guard protects all routes
- Firestore Security Rules (role-based)
- Input validation on forms
- XSS protection (Angular sanitization)
- Password reset via email
- Secure session management with localStorage

**Q: How do you handle data validation?**  
A:
- Angular Reactive Forms validation
- Required fields check
- Email format validation
- Min/max length validation
- Number range validation
- Custom validators for business rules
- Server-side validation in Firestore rules

**Q: What happens if Firestore data has errors?**  
A: We implemented:
- Try-catch error handling in all services
- Toast notifications for user feedback
- Console logging for debugging
- Fallback values for missing data
- Data fix utilities (e.g., fix-product-names)
- Undefined value filtering before Firestore updates

---

### **5. User Experience Questions**

**Q: How do you ensure good user experience?**  
A:
- Loading spinners during data fetch
- Toast notifications for actions
- Real-time updates (no refresh needed)
- Responsive design (mobile-first)
- Clear navigation with tabs
- Badge notifications for unread messages
- Search and filter functionality
- Smooth animations and transitions

**Q: How does the notification system work?**  
A:
- Unread count stored in Firestore
- Badge displays count on tab buttons
- Polling every 5 seconds for updates
- `ionViewWillEnter()` refreshes on page view
- Count clears when messages are read
- Real-time updates using `fixUnreadCounts()`

**Q: How do you handle offline scenarios?**  
A:
- Firestore offline persistence enabled
- Cart stored in localStorage
- Auth state persisted in localStorage
- Error messages inform users of connectivity issues
- Data syncs automatically when back online

---

### **6. Testing & Quality Assurance Questions**

**Q: How did you test your application?**  
A:
- Manual testing for all user flows
- Role-based testing (customer, seller, admin)
- Cross-browser testing (Chrome, Safari, Firefox)
- Mobile device testing (Android, iOS)
- Edge case testing (empty states, errors)
- Performance testing (large datasets)

**Q: What challenges did you face?**  
A:
1. **Chart rendering** - Fixed with proper lifecycle hooks
2. **Landing page redirect** - Solved with localStorage auth
3. **Notification badges** - Fixed with real-time count updates
4. **Undefined Firestore values** - Added value filtering
5. **Product name errors** - Created fix utility tool

---

### **7. Scalability & Future Enhancements Questions**

**Q: How can your system scale?**  
A:
- Firebase auto-scales with usage
- Modular architecture allows easy feature addition
- Lazy loading for performance
- Optimized Firestore queries (indexed fields)
- Image compression before upload
- Pagination for large lists (can be added)

**Q: What features would you add in the future?**  
A:
- Push notifications (FCM)
- Product reviews and ratings
- Advanced search with filters
- Seller analytics dashboard
- Payment gateway integration (PayPal, Stripe)
- Product recommendations (ML)
- Multi-vendor support
- Delivery tracking with GPS
- Email notifications
- Admin panel for system settings

---

### **8. Code Quality Questions**

**Q: How did you structure your code?**  
A:
- Modular architecture (customer, seller, admin modules)
- Service layer for business logic
- Models for type safety
- Guards for route protection
- Shared components for reusability
- SCSS for styling with variables
- TypeScript for type checking
- Comments for complex logic

**Q: How do you manage state?**  
A:
- BehaviorSubject in services for reactive state
- localStorage for persistence
- RxJS Observables for async data
- Component-level state for UI
- Auth service centralizes user state

---

## 🔑 KEY POINTS TO REMEMBER FOR DEFENSE

1. **Project Purpose** - Campus marketplace for students
2. **User Roles** - Customer, Seller, Admin (3 roles)
3. **Tech Stack** - Ionic 8, Angular, Firebase
4. **Main Features** - Shopping, Selling, Management, Chat, Reports
5. **Database** - Firestore NoSQL (6 collections)
6. **Authentication** - Firebase Auth with email/password
7. **Real-time** - Chat and notifications using onSnapshot()
8. **Charts** - Chart.js for analytics (line, pie, bar, doughnut)
9. **Security** - Auth guards, Firestore rules, validation
10. **Cross-platform** - Web, iOS, Android via Capacitor

---

## 📱 DEPLOYMENT INFORMATION

**Current Deployment:** Web (Firebase Hosting possible)  
**Repository:** GitHub - John073104/CampusMarket2  
**Database:** Firebase Firestore (surveyform-6c48b project)  

**Build Commands:**
```bash
npm install              # Install dependencies
ionic serve              # Run development server
ionic build              # Build for production
ionic cap add android    # Add Android platform
ionic cap add ios        # Add iOS platform
```

---

**Good luck with your defense! 🎓✨**
