import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InitDemoPageRoutingModule } from './init-demo-routing.module';

import { InitDemoPage } from './init-demo.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InitDemoPageRoutingModule,
    InitDemoPage
  ]
})
export class InitDemoPageModule {}
