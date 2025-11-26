import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Initialize auth - check if user is logged in
    const user = this.authService.getCurrentUser();
    const currentUrl = this.router.url;
    
    // Only redirect if on landing or root and user is logged in
    if (user && (currentUrl === '/' || currentUrl === '/landing')) {
      this.router.navigate([`/${user.role}/dashboard`]);
    }
  }
}
