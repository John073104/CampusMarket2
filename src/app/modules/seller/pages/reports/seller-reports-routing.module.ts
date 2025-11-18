import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SellerReportsPage } from './seller-reports.page';

const routes: Routes = [
  {
    path: '',
    component: SellerReportsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SellerReportsPageRoutingModule {}
