import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';
import { LocationMapComponent } from '../../../../components/location-map/location-map.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, LocationMapComponent]
})
export class ProfilePage implements OnInit {
  user: User | null = null;
  loading: boolean = false;
  editing: boolean = false;
  showLocationPicker: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
  }

  toggleEdit() {
    this.editing = !this.editing;
  }

  async saveProfile() {
    if (!this.user || !this.user.userId) return;
    
    this.loading = true;
    try {
      await this.userService.updateUserProfile(this.user.userId, {
        name: this.user.name,
        phone: this.user.phone,
        location: this.user.location
      });
      
      // Refresh the user data
      await this.authService.refreshCurrentUser();
      this.user = this.authService.getCurrentUser();
      
      this.editing = false;
      
      const toast = await this.toastController.create({
        message: 'Profile updated successfully!',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (error) {
      console.error('Error saving profile:', error);
      const toast = await this.toastController.create({
        message: 'Failed to update profile. Please try again.',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  toggleLocationPicker() {
    this.showLocationPicker = !this.showLocationPicker;
  }

  onLocationSelected(locationData: { latitude: number; longitude: number; address?: string }) {
    if (this.user) {
      this.user.location = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address
      };
    }
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Sign Out',
          role: 'confirm',
          handler: async () => {
            await this.authService.signOut();
            this.router.navigate(['/landing']);
          }
        }
      ]
    });

    await alert.present();
  }

  onImageError(event: any) {
    // Replace broken image with placeholder
    event.target.style.display = 'none';
  }
}

