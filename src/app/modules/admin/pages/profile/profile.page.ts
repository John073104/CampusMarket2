import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ProfilePage implements OnInit {
  user: User | null = null;
  loading: boolean = false;
  editing: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    console.log('Admin Profile: Current user loaded:', this.user);
  }

  ionViewWillEnter() {
    // Refresh user data when entering page
    this.user = this.authService.getCurrentUser();
    console.log('Admin Profile: User refreshed:', this.user);
  }

  toggleEdit() {
    this.editing = !this.editing;
  }

  async saveProfile() {
    if (!this.user || !this.user.userId) {
      const toast = await this.toastController.create({
        message: 'User information not available',
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      return;
    }
    
    this.loading = true;
    try {
      console.log('Admin Profile: Starting update...');
      console.log('Admin Profile: User ID:', this.user.userId);
      console.log('Admin Profile: Name:', this.user.name);
      console.log('Admin Profile: Phone:', this.user.phone);
      
      const updateData = {
        name: this.user.name,
        phone: this.user.phone
      };
      
      console.log('Admin Profile: Calling updateUserProfile with:', updateData);
      await this.userService.updateUserProfile(this.user.userId, updateData);
      console.log('Admin Profile: Update completed');
      
      // Refresh the user data from AuthService
      console.log('Admin Profile: Refreshing current user...');
      await this.authService.refreshCurrentUser();
      this.user = this.authService.getCurrentUser();
      console.log('Admin Profile: User data refreshed:', this.user);
      
      this.editing = false;
      
      const toast = await this.toastController.create({
        message: 'Profile updated successfully!',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      const toast = await this.toastController.create({
        message: `Failed to update profile: ${error.message || 'Please try again'}`,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
  }
}
