import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      // Store the attempted URL for redirecting after login
      this.router.navigate(['/landing']);
      return false;
    }

    // Check for required roles
    const requiredRoles = route.data['roles'] as string[];
    
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      // Redirect to appropriate dashboard
      this.router.navigate([`/${user.role}/dashboard`]);
      return false;
    }

    return true;
  }
}
