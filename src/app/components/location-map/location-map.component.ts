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
  @Input() latitude: number = 14.5995; // Default: Manila, Philippines
  @Input() longitude: number = 120.9842;
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

    // Create map
    this.map = L.map('map').setView([this.latitude, this.longitude], 13);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Add marker
    this.marker = L.marker([this.latitude, this.longitude], {
      draggable: this.editable
    }).addTo(this.map);

    if (this.editable) {
      // Allow clicking on map to set location
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.updateMarkerPosition(e.latlng);
      });

      // Handle marker drag
      this.marker.on('dragend', () => {
        const position = this.marker!.getLatLng();
        this.updateMarkerPosition(position);
      });
    }

    // Get initial address
    this.getAddressFromCoordinates(this.latitude, this.longitude);
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
      // Using Nominatim (OpenStreetMap's geocoding service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        const address = data.display_name;
        this.locationSelected.emit({ latitude: lat, longitude: lng, address });
        
        if (this.marker) {
          this.marker.bindPopup(address).openPopup();
        }
      }
    } catch (error) {
      console.error('Error getting address:', error);
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
