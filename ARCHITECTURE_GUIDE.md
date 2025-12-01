# CampusMarket Architecture Guide

## Table of Contents
1. [Overview](#overview)
2. [File Types and Their Roles](#file-types-and-their-roles)
3. [Component Architecture (.ts)](#component-architecture-ts)
4. [Service Layer (.service.ts)](#service-layer-servicets)
5. [Module System (.module.ts)](#module-system-modulets)
6. [Models (.model.ts)](#models-modelts)
7. [Guards (.guard.ts)](#guards-guardts)
8. [Data Flow Examples](#data-flow-examples)

---

## Overview

CampusMarket follows Angular's component-based architecture with a clear separation of concerns:

```
┌─────────────────┐
│   Components    │ ← User Interface (Pages/Components)
│   (.page.ts)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    Services     │ ← Business Logic & Data Access
│  (.service.ts)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    Firebase     │ ← Database (Firestore)
│   (Backend)     │
└─────────────────┘
```

---

## File Types and Their Roles

### 1. **Component Files (.page.ts / .component.ts)**
**Purpose**: Handle UI logic, user interactions, and display data

**Location**: 
- `src/app/modules/customer/pages/` (Customer pages)
- `src/app/modules/seller/pages/` (Seller pages)
- `src/app/modules/admin/pages/` (Admin pages)

**Responsibilities**:
- Respond to user actions (clicks, form submissions)
- Display data received from services
- Navigate between pages
- Manage component-level state

**Example**: `cart.page.ts`

---

### 2. **Service Files (.service.ts)**
**Purpose**: Handle business logic, API calls, and data management

**Location**: `src/app/services/`

**Responsibilities**:
- Communicate with Firebase/Firestore
- Perform CRUD operations (Create, Read, Update, Delete)
- Share data between components
- Handle authentication and authorization

**Example**: `order.service.ts`

---

### 3. **Module Files (.module.ts)**
**Purpose**: Organize and group related components, services, and features

**Location**: 
- `src/app/modules/customer/customer.module.ts`
- `src/app/modules/seller/seller.module.ts`
- `src/app/modules/admin/admin.module.ts`

**Responsibilities**:
- Import necessary Angular/Ionic modules
- Declare components used in the module
- Export components for use in other modules
- Define providers (services)

---

### 4. **Model Files (.model.ts)**
**Purpose**: Define TypeScript interfaces and types for data structures

**Location**: `src/app/models/`

**Responsibilities**:
- Define data structure contracts
- Provide type safety
- Document expected data formats

**Example**: `order.model.ts`

---

### 5. **Guard Files (.guard.ts)**
**Purpose**: Control navigation and route access

**Location**: `src/app/guards/`

**Responsibilities**:
- Verify authentication status
- Check user roles/permissions
- Redirect unauthorized users

---

## Component Architecture (.ts)

### Structure Example: `cart.page.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

// Services imported
import { CartService } from '../../../../services/cart.service';
import { OrderService } from '../../../../services/order.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CartPage implements OnInit {
  
  // 1. PROPERTIES (Variables)
  cartItems: CartItem[] = [];
  total: number = 0;
  loading: boolean = false;
  
  campusLocations = [
    { name: 'CTE Building', fee: 20 },
    { name: 'Main Building', fee: 15 },
    // ... more locations
  ];

  checkoutData = {
    paymentMethod: 'COD',
    shippingLocation: 'CTE Building',
    shippingFee: 20
  };

  // 2. CONSTRUCTOR (Dependency Injection)
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  // 3. LIFECYCLE HOOKS
  ngOnInit() {
    this.loadCart();
  }

  ionViewWillEnter() {
    this.loadCart();
  }

  // 4. METHODS (Functions)
  
  // Load cart items from service
  async loadCart() {
    this.loading = true;
    this.cartService.getCart().subscribe(items => {
      this.cartItems = items;
      this.calculateTotal();
      this.loading = false;
    });
  }

  // Calculate total price
  calculateTotal() {
    this.total = this.cartItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
  }

  // Handle location change
  onLocationChange() {
    const selected = this.campusLocations.find(
      loc => loc.name === this.checkoutData.shippingLocation
    );
    if (selected) {
      this.checkoutData.shippingFee = selected.fee;
    }
  }

  // Process checkout
  async processCheckout() {
    try {
      const order = await this.orderService.createOrder(
        this.cartItems,
        this.total,
        this.checkoutData
      );
      
      await this.cartService.clearCart();
      this.router.navigate(['/customer/orders']);
    } catch (error) {
      console.error('Checkout error:', error);
    }
  }
}
```

### Key Concepts:

**1. Dependency Injection (Constructor)**
```typescript
constructor(
  private cartService: CartService,  // Inject CartService
  private router: Router              // Inject Router
) {}
```
- Services are "injected" into the component
- `private` makes them accessible throughout the class
- Angular automatically provides these instances

**2. Lifecycle Hooks**
- `ngOnInit()`: Runs once when component is created
- `ionViewWillEnter()`: Runs every time page is visited (Ionic-specific)
- `ngOnDestroy()`: Runs when component is destroyed

**3. Async/Await vs Observables**
```typescript
// Observable subscription
this.cartService.getCart().subscribe(items => {
  this.cartItems = items;
});

// Async/await with Promises
async processCheckout() {
  const order = await this.orderService.createOrder(...);
}
```

---

## Service Layer (.service.ts)

### Structure Example: `order.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, query, where, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'  // Makes service available app-wide
})
export class OrderService {
  
  // 1. PRIVATE PROPERTIES
  private ordersCollection = 'orders';
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  
  // 2. PUBLIC OBSERVABLES
  orders$ = this.ordersSubject.asObservable();

  // 3. CONSTRUCTOR (Inject Dependencies)
  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {
    this.loadOrders();
  }

  // 4. CRUD METHODS

  /**
   * Create a new order in Firestore
   * @param items - Array of cart items
   * @param total - Total price
   * @param deliveryInfo - Shipping details
   * @returns Promise with order ID
   */
  async createOrder(
    items: CartItem[], 
    total: number, 
    deliveryInfo: any
  ): Promise<string> {
    try {
      const user = await this.authService.getCurrentUser();
      
      // Prepare order object
      const newOrder: Order = {
        id: '', // Will be set by Firestore
        customerId: user.uid,
        customerName: user.displayName,
        items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          sellerId: item.sellerId
        })),
        totalPrice: total,
        status: 'placed',
        paymentMethod: deliveryInfo.paymentMethod,
        shippingLocation: deliveryInfo.shippingLocation,
        shippingFee: deliveryInfo.shippingFee,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to Firestore
      const ordersRef = collection(this.firestore, this.ordersCollection);
      const docRef = await addDoc(ordersRef, newOrder);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get all orders for current user
   * @returns Observable of orders array
   */
  getUserOrders(): Observable<Order[]> {
    return this.orders$;
  }

  /**
   * Update order status
   * @param orderId - ID of order to update
   * @param status - New status
   */
  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const orderRef = doc(this.firestore, this.ordersCollection, orderId);
      await updateDoc(orderRef, {
        status: status,
        updatedAt: serverTimestamp()
      });
      
      // Refresh orders list
      await this.loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  /**
   * Load orders from Firestore
   */
  private async loadOrders(): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser();
      const ordersRef = collection(this.firestore, this.ordersCollection);
      const q = query(ordersRef, where('customerId', '==', user.uid));
      
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      
      // Update BehaviorSubject
      this.ordersSubject.next(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }
}
```

### Key Concepts:

**1. @Injectable Decorator**
```typescript
@Injectable({ providedIn: 'root' })
```
- Makes the service available throughout the app
- Creates a singleton instance (one shared instance)

**2. BehaviorSubject Pattern**
```typescript
private ordersSubject = new BehaviorSubject<Order[]>([]);
orders$ = this.ordersSubject.asObservable();
```
- Stores current state
- Components subscribe to get real-time updates
- `next()` method updates the value

**3. Async Operations**
```typescript
async createOrder(...): Promise<string> {
  const docRef = await addDoc(ordersRef, newOrder);
  return docRef.id;
}
```
- `async` keyword marks function as asynchronous
- `await` waits for Promise to resolve
- Returns Promise that resolves to string

**4. Firestore Operations**
```typescript
// Add document
await addDoc(collection(firestore, 'orders'), data);

// Update document
await updateDoc(doc(firestore, 'orders', id), { status: 'confirmed' });

// Query documents
const q = query(collection(firestore, 'orders'), where('status', '==', 'placed'));
const snapshot = await getDocs(q);
```

---

## Module System (.module.ts)

### Structure Example: `customer.module.ts`

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

// Routing
import { CustomerRoutingModule } from './customer-routing.module';

// Components
import { CustomerTabsPage } from './customer-tabs.page';

// Services (provided at root, not needed here)
// import { CartService } from '../../services/cart.service';

@NgModule({
  imports: [
    CommonModule,        // Basic Angular directives (ngIf, ngFor, etc.)
    FormsModule,         // Form handling (ngModel)
    IonicModule,         // Ionic components (ion-button, ion-card, etc.)
    CustomerRoutingModule // Routes for customer module
  ],
  declarations: [
    CustomerTabsPage     // Components declared in this module
  ],
  // providers: []       // Not needed if services use providedIn: 'root'
})
export class CustomerModule { }
```

### Key Concepts:

**1. Imports Array**
- External modules needed by this module
- `CommonModule`: Angular basics
- `FormsModule`: Two-way data binding
- `IonicModule`: Ionic UI components

**2. Declarations Array**
- Components/Directives/Pipes owned by this module
- Only declare components here, not services

**3. Providers Array**
- Services available to this module
- Usually empty if services use `providedIn: 'root'`

---

## Models (.model.ts)

### Structure Example: `order.model.ts`

```typescript
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'placed' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentMethod: 'COD' | 'GCash';
  shippingLocation?: string;
  shippingFee?: number;
  pickupLocation?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  sellerId: string;
  sellerName?: string;
}

export interface OrderStatus {
  value: string;
  label: string;
  color: string;
  icon: string;
}
```

### Key Concepts:

**1. Interface vs Class**
```typescript
// Interface (data structure only)
export interface Order {
  id: string;
  name: string;
}

// Class (can have methods)
export class Order {
  constructor(
    public id: string,
    public name: string
  ) {}
  
  getDisplayName(): string {
    return `Order #${this.id}`;
  }
}
```

**2. Optional Properties**
```typescript
shippingLocation?: string;  // Can be undefined
```

**3. Union Types**
```typescript
status: 'placed' | 'confirmed' | 'cancelled';  // Only these values allowed
```

---

## Guards (.guard.ts)

### Structure Example: `auth.guard.ts`

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const isAuthenticated = await this.authService.isLoggedIn();
    
    if (!isAuthenticated) {
      this.router.navigate(['/auth/login']);
      return false;
    }
    
    return true;
  }
}
```

### Usage in Routing:
```typescript
{
  path: 'customer',
  canActivate: [AuthGuard],  // Protect this route
  loadChildren: () => import('./modules/customer/customer.module')
}
```

---

## Data Flow Examples

### Example 1: Adding Item to Cart

```
┌─────────────────────────────────────────────────────────┐
│ 1. User clicks "Add to Cart" button                     │
│    (product-detail.page.html)                            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 2. addToCart() method called                             │
│    (product-detail.page.ts)                              │
│                                                           │
│    async addToCart() {                                   │
│      await this.cartService.addToCart(this.product);     │
│      // Show success modal                               │
│    }                                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 3. CartService.addToCart() processes request             │
│    (cart.service.ts)                                     │
│                                                           │
│    async addToCart(product: Product) {                   │
│      const cart = await this.getCartItems();             │
│      cart.push(product);                                 │
│      await this.storage.set('cart', cart);               │
│      this.cartSubject.next(cart);  // Notify subscribers │
│    }                                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Cart badge updates automatically                      │
│    (Any component subscribed to cartService.cart$)       │
└─────────────────────────────────────────────────────────┘
```

### Example 2: Creating an Order

```
┌─────────────────────────────────────────────────────────┐
│ 1. User clicks "Place Order"                             │
│    (cart.page.html)                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 2. processCheckout() validates and prepares data         │
│    (cart.page.ts)                                        │
│                                                           │
│    async processCheckout() {                             │
│      const orderId = await this.orderService.createOrder(│
│        this.cartItems,                                    │
│        this.total,                                        │
│        this.checkoutData                                 │
│      );                                                   │
│    }                                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 3. OrderService creates order in Firebase                │
│    (order.service.ts)                                    │
│                                                           │
│    async createOrder(...) {                              │
│      const newOrder = { ... };                           │
│      const docRef = await addDoc(                        │
│        collection(firestore, 'orders'),                  │
│        newOrder                                          │
│      );                                                   │
│      return docRef.id;                                   │
│    }                                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Firebase saves order to Firestore database            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Success! User redirected to orders page               │
│    (cart.page.ts)                                        │
│                                                           │
│    this.router.navigate(['/customer/orders']);           │
└─────────────────────────────────────────────────────────┘
```

### Example 3: Real-time Data Updates

```
┌─────────────────────────────────────────────────────────┐
│ Component subscribes to service observable               │
│ (order-detail.page.ts - ngOnInit)                        │
│                                                           │
│ this.orderService.orders$.subscribe(orders => {          │
│   this.orders = orders;                                  │
│ });                                                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│ Service fetches data from Firebase                       │
│ (order.service.ts)                                       │
│                                                           │
│ const snapshot = await getDocs(query(...));              │
│ const orders = snapshot.docs.map(doc => doc.data());     │
│ this.ordersSubject.next(orders); // Push to subscribers  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│ Component automatically receives update                  │
│ (Angular change detection updates view)                  │
└─────────────────────────────────────────────────────────┘
```

---

## Common Patterns

### 1. Loading States
```typescript
loading: boolean = false;

async loadData() {
  this.loading = true;
  try {
    this.data = await this.service.getData();
  } finally {
    this.loading = false;
  }
}
```

### 2. Error Handling
```typescript
async saveData() {
  try {
    await this.service.save(this.data);
    this.showSuccess();
  } catch (error) {
    console.error('Save failed:', error);
    this.showError();
  }
}
```

### 3. Form Validation
```typescript
isValid(): boolean {
  return this.name.length > 0 && 
         this.email.includes('@') &&
         this.quantity > 0;
}
```

### 4. Conditional Rendering (HTML)
```html
<!-- Show loading spinner -->
<ion-spinner *ngIf="loading"></ion-spinner>

<!-- Show content when loaded -->
<div *ngIf="!loading">
  <ion-card *ngFor="let item of items">
    {{ item.name }}
  </ion-card>
</div>

<!-- Show message if empty -->
<div *ngIf="!loading && items.length === 0">
  No items found
</div>
```

---

## Summary

| File Type | Purpose | Example |
|-----------|---------|---------|
| `.page.ts` | UI logic, user interactions | `cart.page.ts` |
| `.service.ts` | Business logic, data access | `order.service.ts` |
| `.module.ts` | Organize features | `customer.module.ts` |
| `.model.ts` | Data structures | `order.model.ts` |
| `.guard.ts` | Route protection | `auth.guard.ts` |

**Key Principles**:
1. **Separation of Concerns**: Components handle UI, services handle data
2. **Dependency Injection**: Services injected into components via constructor
3. **Observables**: For real-time data updates
4. **Async/Await**: For handling asynchronous operations
5. **Type Safety**: TypeScript interfaces ensure data consistency

---

## Further Learning

- **Angular Documentation**: https://angular.dev/
- **Ionic Documentation**: https://ionicframework.com/docs
- **Firebase Documentation**: https://firebase.google.com/docs
- **RxJS Documentation**: https://rxjs.dev/

