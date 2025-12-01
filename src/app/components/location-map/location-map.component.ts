import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import * as L from 'leaflet';

@Component({
  selector: 'app-location-map',
  templateUrl: './location-map.component.html',
  styleUrls: ['./location-map.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class LocationMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() latitude: number = 13.1640; // Default: Victoria, Alcate, Oriental Mindoro
  @Input() longitude: number = 121.3279;
  @Input() editable: boolean = false; // Can user pick location?
  @Input() height: string = '400px';
  @Output() locationSelected = new EventEmitter<{ latitude: number; longitude: number; address?: string }>();

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  constructor() {}

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeMap();
    }, 100);
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

    // Create map centered on Oriental Mindoro, Philippines
    this.map = L.map('map', {
      minZoom: 6,  // Prevent zooming out too far
      maxBounds: [  // Restrict map to Philippines bounds
        [4.5, 116.0],   // Southwest corner (southernmost Philippines)
        [21.0, 127.0]   // Northeast corner (northernmost Philippines)
      ],
      maxBoundsViscosity: 1.0  // Make bounds solid
    }).setView([this.latitude, this.longitude], 13);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 6
    }).addTo(this.map);

    // Add marker - NEVER draggable, always fixed to GPS position
    this.marker = L.marker([this.latitude, this.longitude], {
      draggable: false  // Always false - marker cannot be moved manually
    }).addTo(this.map);

    // Always get real GPS location automatically
    this.getCurrentLocation();
  }

  private updateMarkerPosition(latlng: L.LatLng) {
    if (this.marker) {
      this.marker.setLatLng(latlng);
      this.map?.panTo(latlng);
      
      const lat = latlng.lat;
      const lng = latlng.lng;
      
      this.getAddressFromCoordinates(lat, lng);
      this.locationSelected.emit({ latitude: lat, longitude: lng });
    }
  }

  private async getAddressFromCoordinates(lat: number, lng: number) {
    try {
      // Using Nominatim (OpenStreetMap's geocoding service) with higher zoom for accuracy
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=19&addressdetails=1&accept-language=en`
      );
      const data = await response.json();
      
      if (data.address) {
        // Build more accurate address from components
        const addressParts = [];
        
        // Add specific location details first
        if (data.address.road) addressParts.push(data.address.road);
        if (data.address.village) addressParts.push(data.address.village);
        if (data.address.suburb) addressParts.push(data.address.suburb);
        if (data.address.hamlet) addressParts.push(data.address.hamlet);
        
        // Add municipality/town
        if (data.address.municipality) addressParts.push(data.address.municipality);
        if (data.address.town) addressParts.push(data.address.town);
        if (data.address.city) addressParts.push(data.address.city);
        
        // Add province
        if (data.address.state) addressParts.push(data.address.state);
        if (data.address.province) addressParts.push(data.address.province);
        
        const address = addressParts.length > 0 ? addressParts.join(', ') : data.display_name;
        
        this.locationSelected.emit({ latitude: lat, longitude: lng, address });
        
        if (this.marker) {
          this.marker.bindPopup(`
            <strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
            <strong>Address:</strong> ${address}
          `).openPopup();
        }
      } else if (data.display_name) {
        // Fallback to display name
        const address = data.display_name;
        this.locationSelected.emit({ latitude: lat, longitude: lng, address });
        
        if (this.marker) {
          this.marker.bindPopup(address).openPopup();
        }
      }
    } catch (error) {
      console.error('Error getting address:', error);
      // Emit coordinates anyway so user can save location
      this.locationSelected.emit({ 
        latitude: lat, 
        longitude: lng, 
        address: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}` 
      });
    }
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (this.map && this.marker) {
            this.marker.setLatLng([lat, lng]);
            this.map.setView([lat, lng], 15);
            this.getAddressFromCoordinates(lat, lng);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please select manually on the map.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
