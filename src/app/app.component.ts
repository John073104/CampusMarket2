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
    // Check if user is already logged in on app start
    this.authService.currentUser$.subscribe(user => {
      const currentUrl = this.router.url;
      if (user && (currentUrl === '/' || currentUrl === '/landing')) {
        // Redirect to appropriate dashboard if on landing page
        this.router.navigate([`/${user.role}/dashboard`]);
      }
    });
  }
}
