import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class UsersPage implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading: boolean = false;
  selectedRole: string = 'all';
  searchTerm: string = '';

  constructor(
    private userService: UserService,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    try {
      this.users = await this.userService.getAllUsers();
      this.filterUsers();
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      this.loading = false;
    }
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(user => {
      const matchesRole = this.selectedRole === 'all' || user.role === this.selectedRole;
      const matchesSearch = user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           user.name?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }

  async toggleUserStatus(user: User) {
    const action = user.isActive ? 'ban' : 'activate';
    const alert = await this.alertController.create({
      header: `${action === 'ban' ? 'Ban' : 'Activate'} User`,
      message: `Are you sure you want to ${action} this user?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: action === 'ban' ? 'Ban' : 'Activate',
          role: 'confirm',
          handler: async () => {
            try {
              await this.userService.updateUserProfile(user.userId!, { isActive: !user.isActive });
              this.loadUsers();
              
              const toast = await this.toastController.create({
                message: `User ${action === 'ban' ? 'banned' : 'activated'} successfully!`,
                duration: 2000,
                color: 'success',
                position: 'top'
              });
              await toast.present();
            } catch (error) {
              console.error('Error updating user:', error);
              const toast = await this.toastController.create({
                message: 'Failed to update user status. Please try again.',
                duration: 3000,
                color: 'danger',
                position: 'top'
              });
              await toast.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getRoleColor(role: string): string {
    const colors: any = {
      'admin': 'danger',
      'seller': 'warning',
      'customer': 'primary'
    };
    return colors[role] || 'medium';
  }
}

