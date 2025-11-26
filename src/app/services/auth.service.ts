import { Injectable } from '@angular/core';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {
    this.initAuthListener();
  }

  private initAuthListener() {
    // Check localStorage first for immediate user state
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        this.currentUserSubject.next(userData);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }

    // Then listen for auth state changes
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await this.getUserData(firebaseUser.uid);
        this.currentUserSubject.next(userData);
        if (userData) {
          localStorage.setItem('currentUser', JSON.stringify(userData));
        }
      } else {
        this.currentUserSubject.next(null);
        localStorage.removeItem('currentUser');
      }
    });
  }

  async signUp(email: string, password: string, name: string): Promise<void> {
    try {
      console.log('Attempting signup for:', email);
      console.log('Firebase Auth available:', !!this.auth);
      
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      
      console.log('User created in Firebase Auth:', userCredential.user.uid);
      
      // Create user document in Firestore
      const userData: User = {
        userId: userCredential.user.uid,
        email: email,
        role: 'customer', // Default role
        name: name,
        dateJoined: serverTimestamp(),
        isActive: true
      };

      await setDoc(
        doc(this.firestore, 'users', userCredential.user.uid), 
        userData
      );

      console.log('User document created in Firestore successfully');
      
      // Sign out immediately after signup to redirect to login
      await signOut(this.auth);
      this.currentUserSubject.next(null);
      // Don't auto-redirect, let the signup page handle it
    } catch (error: any) {
      console.error('Signup error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Provide user-friendly error messages
      switch (error.code) {
        case 'auth/configuration-not-found':
          throw new Error('Firebase Authentication is not enabled. Please enable Email/Password sign-in in Firebase Console.');
        case 'auth/network-request-failed':
          throw new Error('Network error. Please check your internet connection and try again.');
        case 'auth/email-already-in-use':
          throw new Error('This email is already registered. Please login instead.');
        case 'auth/invalid-email':
          throw new Error('Invalid email format.');
        case 'auth/weak-password':
          throw new Error('Password is too weak. Use at least 6 characters.');
        case 'auth/operation-not-allowed':
          throw new Error('Email/Password sign-in is not enabled. Please contact administrator.');
        default:
          throw new Error(error.message || 'Signup failed. Please try again.');
      }
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    try {
      console.log('Attempting login for:', email);
      console.log('Firebase Auth state:', this.auth.currentUser ? 'Active' : 'Not initialized');
      
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      
      console.log('User signed in successfully:', userCredential.user.uid);
      const userData = await this.getUserData(userCredential.user.uid);
      console.log('User data retrieved:', userData);
      
      if (!userData) {
        console.error('User data not found in Firestore for:', userCredential.user.uid);
        throw new Error('User profile not found. Please contact support.');
      }
      
      this.currentUserSubject.next(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      await this.redirectByRole(userData.role);
    } catch (error: any) {
      console.error('Login error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Provide user-friendly error messages
      switch (error.code) {
        case 'auth/configuration-not-found':
          throw new Error('Firebase Authentication is not enabled. Please enable Email/Password sign-in in Firebase Console.');
        case 'auth/network-request-failed':
          throw new Error('Network error. Please check your internet connection and try again.');
        case 'auth/too-many-requests':
          throw new Error('Too many failed attempts. Please try again later.');
        case 'auth/user-not-found':
          throw new Error('No account found with this email.');
        case 'auth/wrong-password':
          throw new Error('Incorrect password. Please try again.');
        case 'auth/invalid-email':
          throw new Error('Invalid email format.');
        case 'auth/user-disabled':
          throw new Error('This account has been disabled.');
        case 'auth/invalid-credential':
          throw new Error('Invalid email or password.');
        default:
          throw new Error(error.message || 'Login failed. Please try again.');
      }
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
    this.router.navigate(['/landing']);
  }

  private async getUserData(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(this.firestore, 'users', userId));
    return userDoc.exists() ? userDoc.data() as User : null;
  }

  private async redirectByRole(role: string): Promise<void> {
    switch (role) {
      case 'customer':
        this.router.navigate(['/customer']);
        break;
      case 'seller':
        this.router.navigate(['/seller']);
        break;
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      default:
        this.router.navigate(['/landing']);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  async refreshCurrentUser(): Promise<void> {
    const currentUser = this.currentUserSubject.value;
    if (currentUser && currentUser.userId) {
      try {
        const userDoc = await getDoc(doc(this.firestore, 'users', currentUser.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          this.currentUserSubject.next(userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error.code, error.message);
      throw error;
    }
  }
}