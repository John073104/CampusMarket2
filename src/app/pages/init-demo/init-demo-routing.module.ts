import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InitDemoPage } from './init-demo.page';

const routes: Routes = [
  {
    path: '',
    component: InitDemoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InitDemoPageRoutingModule {}
