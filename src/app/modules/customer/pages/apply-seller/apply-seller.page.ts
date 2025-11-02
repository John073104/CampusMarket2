import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/user.service';

@Component({
  selector: 'app-apply-seller',
  templateUrl: './apply-seller.page.html',
  styleUrls: ['./apply-seller.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ApplySellerPage implements OnInit {
  application = {
    reasonForSelling: '',
    businessDescription: ''
  };
  submitting: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
  }

  async submitApplication() {
    if (!this.application.reasonForSelling) {
      const toast = await this.toastController.create({
        message: 'Please provide a reason for selling.',
        duration: 2000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Submit Application',
      message: 'Are you sure you want to submit your seller application?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Submit',
          role: 'confirm',
          handler: async () => {
            this.submitting = true;
            try {
              const user = this.authService.getCurrentUser();
              if (!user) return;

              await this.userService.submitSellerApplication(
                user.userId!,
                user.name || user.email,
                user.email,
                this.application.reasonForSelling,
                this.application.businessDescription
              );

              const successAlert = await this.alertController.create({
                header: 'Success!',
                message: 'Your seller application has been submitted successfully. You will be notified once it is reviewed.',
                buttons: ['OK']
              });
              await successAlert.present();
              await successAlert.onDidDismiss();

              this.router.navigate(['/customer/dashboard']);
            } catch (error) {
              console.error('Error submitting application:', error);
              const toast = await this.toastController.create({
                message: 'Failed to submit application. Please try again.',
                duration: 3000,
                color: 'danger',
                position: 'top'
              });
              await toast.present();
            } finally {
              this.submitting = false;
            }
          }
        }
      ]
    });

    await alert.present();
  }
}

