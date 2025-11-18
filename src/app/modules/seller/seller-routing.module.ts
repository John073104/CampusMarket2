import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SellerTabsPage } from './seller-tabs.page';

const routes: Routes = [
  {
    path: '',
    component: SellerTabsPage,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardPageModule)
      },
  {
    path: 'products',
    loadChildren: () => import('./pages/products/products.module').then(m => m.ProductsPageModule)
  },
  {
    path: 'add-product',
    loadChildren: () => import('./pages/add-product/add-product.module').then(m => m.AddProductPageModule)
  },
  {
    path: 'edit-product/:id',
    loadChildren: () => import('./pages/edit-product/edit-product.module').then(m => m.EditProductPageModule)
  },
  {
    path: 'orders',
    loadChildren: () => import('./pages/orders/orders.module').then(m => m.OrdersPageModule)
  },
  {
    path: 'order-detail/:id',
    loadChildren: () => import('./pages/order-detail/order-detail.module').then(m => m.OrderDetailPageModule)
  },
  {
    path: 'chats',
    loadChildren: () => import('./pages/chats/chats.module').then(m => m.ChatsPageModule)
  },
  {
    path: 'chat/:id',
    loadChildren: () => import('./pages/chat/chat.module').then(m => m.ChatPageModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfilePageModule)
  },
  {
    path: 'analytics',
    loadChildren: () => import('./pages/analytics/analytics.module').then(m => m.AnalyticsPageModule)
  },
      {
        path: 'reports',
        loadChildren: () => import('./pages/reports/seller-reports.module').then(m => m.SellerReportsPageModule)
      },
      {
        path: 'analytics',
        loadChildren: () => import('./pages/analytics/analytics.module').then(m => m.AnalyticsPageModule)
      }
    ]
  },
  {
    path: 'add-product',
    loadChildren: () => import('./pages/add-product/add-product.module').then(m => m.AddProductPageModule)
  },
  {
    path: 'edit-product/:id',
    loadChildren: () => import('./pages/edit-product/edit-product.module').then(m => m.EditProductPageModule)
  },
  {
    path: 'order-detail/:id',
    loadChildren: () => import('./pages/order-detail/order-detail.module').then(m => m.OrderDetailPageModule)
  },
  {
    path: 'chat/:id',
    loadChildren: () => import('./pages/chat/chat.module').then(m => m.ChatPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SellerRoutingModule { }
