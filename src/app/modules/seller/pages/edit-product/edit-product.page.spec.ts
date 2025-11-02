import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditProductPage } from './edit-product.page';

describe('EditProductPage', () => {
  let component: EditProductPage;
  let fixture: ComponentFixture<EditProductPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProductPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
