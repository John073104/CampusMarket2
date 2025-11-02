import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule]
})
export class SignupPage {
  signupForm: FormGroup;
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.signupForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSignup() {
    if (this.signupForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Creating account...',
      });
      await loading.present();

      try {
        const { name, email, password } = this.signupForm.value;
        await this.authService.signUp(email, password, name);
        await loading.dismiss();
      } catch (error: any) {
        await loading.dismiss();
        const alert = await this.alertController.create({
          header: 'Signup Failed',
          message: (error?.code ? error.code + ': ' : '') + (error?.message || 'Could not create account. Please try again.'),
          buttons: ['OK']
        });
        await alert.present();
      }
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goBack() {
    this.router.navigate(['/landing']);
  }
}
