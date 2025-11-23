import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FixProductsPage } from './fix-products.page';

const routes: Routes = [
  {
    path: '',
    component: FixProductsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FixProductsPageRoutingModule {}
