import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule]
})
export class LoginPage {
  loginForm: FormGroup;
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onLogin() {
    if (this.loginForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Logging in...',
      });
      await loading.present();

      try {
        const { email, password } = this.loginForm.value;
        await this.authService.signIn(email, password);
        await loading.dismiss();
      } catch (error: any) {
        await loading.dismiss();
        const alert = await this.alertController.create({
          header: 'Login Failed',
          message: (error?.code ? error.code + ': ' : '') + (error?.message || 'Invalid credentials. Please try again.'),
          buttons: ['OK']
        });
        await alert.present();
      }
    }
  }

  goToSignup() {
    this.router.navigate(['/auth/signup']);
  }

  async forgotPassword() {
    const alert = await this.alertController.create({
      header: 'Reset Password',
      message: 'Enter your email address to receive a password reset link.',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Email address'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Send Reset Link',
          handler: async (data) => {
            if (data.email) {
              const loading = await this.loadingController.create({
                message: 'Sending reset link...',
              });
              await loading.present();

              try {
                await this.authService.resetPassword(data.email);
                await loading.dismiss();
                
                const successAlert = await this.alertController.create({
                  header: 'Success',
                  message: 'Password reset link has been sent to your email.',
                  buttons: ['OK']
                });
                await successAlert.present();
              } catch (error: any) {
                await loading.dismiss();
                const errorAlert = await this.alertController.create({
                  header: 'Error',
                  message: 'Failed to send reset link. Please check your email address.',
                  buttons: ['OK']
                });
                await errorAlert.present();
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  goBack() {
    this.router.navigate(['/landing']);
  }
}