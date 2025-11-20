import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-users-map',
  templateUrl: './users-map.page.html',
  styleUrls: ['./users-map.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class UsersMapPage implements OnInit, AfterViewInit, OnDestroy {
  private map: L.Map | null = null;
  users: User[] = [];
  loading = true;
  filterRole: 'all' | 'customer' | 'seller' | 'admin' = 'all';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  async loadUsers() {
    this.loading = true;
    try {
      this.users = await this.userService.getAllUsers();
      this.updateMapMarkers();
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      this.loading = false;
    }
  }

  private initializeMap() {
    // Fix Leaflet icon issue
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    // Default center: Philippines
    this.map = L.map('map').setView([14.5995, 120.9842], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.updateMapMarkers();
  }

  private updateMapMarkers() {
    if (!this.map) return;

    // Clear existing markers
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map!.removeLayer(layer);
      }
    });

    // Filter users
    const filteredUsers = this.filterRole === 'all' 
      ? this.users 
      : this.users.filter(u => u.role === this.filterRole);

    // Add markers for users with locations
    const usersWithLocation = filteredUsers.filter(u => u.location);
    
    if (usersWithLocation.length === 0) return;

    usersWithLocation.forEach(user => {
      if (user.location) {
        const marker = L.marker([user.location.latitude, user.location.longitude]);
        
        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: var(--ion-color-primary);">${user.name}</h3>
            <p style="margin: 4px 0;"><strong>Role:</strong> ${user.role.toUpperCase()}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${user.email}</p>
            ${user.phone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${user.phone}</p>` : ''}
            ${user.courseName ? `<p style="margin: 4px 0;"><strong>Course:</strong> ${user.courseName}</p>` : ''}
            ${user.location.address ? `<p style="margin: 4px 0; font-size: 0.9em; color: #666;">${user.location.address}</p>` : ''}
          </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.addTo(this.map!);
      }
    });

    // Fit bounds to show all markers
    const bounds = L.latLngBounds(
      usersWithLocation.map(u => [u.location!.latitude, u.location!.longitude])
    );
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  onFilterChange() {
    this.updateMapMarkers();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
