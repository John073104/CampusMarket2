import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full'
  },
  {
    path: 'landing',
    loadChildren: () => import('./pages/landing/landing.module').then( m => m.LandingPageModule)
  },
  {
    path: 'auth/login',
    loadChildren: () => import('./modules/auth/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'auth/signup',
    loadChildren: () => import('./modules/auth/signup/signup.module').then( m => m.SignupPageModule)
  },
  {
    path: 'customer',
    loadChildren: () => import('./modules/customer/customer.module').then( m => m.CustomerModule),
    canActivate: [AuthGuard],
    data: { roles: ['customer', 'seller'] }
  },
  {
    path: 'seller',
    loadChildren: () => import('./modules/seller/seller.module').then( m => m.SellerModule),
    canActivate: [AuthGuard],
    data: { roles: ['seller'] }
  },
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin/admin.module').then( m => m.AdminModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'init-demo',
    loadChildren: () => import('./pages/init-demo/init-demo.module').then( m => m.InitDemoPageModule)
  },
  {
    path: 'fix-products',
    loadChildren: () => import('./pages/fix-products/fix-products.module').then( m => m.FixProductsPageModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
