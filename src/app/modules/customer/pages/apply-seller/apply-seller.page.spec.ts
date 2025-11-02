import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplySellerPage } from './apply-seller.page';

describe('ApplySellerPage', () => {
  let component: ApplySellerPage;
  let fixture: ComponentFixture<ApplySellerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplySellerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
