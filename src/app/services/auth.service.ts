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
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await this.getUserData(firebaseUser.uid);
        this.currentUserSubject.next(userData);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  async signUp(email: string, password: string, name: string): Promise<void> {
    try {
      console.log('Attempting signup for:', email);
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

      console.log('User document created in Firestore');
      // Sign out immediately after signup to redirect to login
      await signOut(this.auth);
      this.currentUserSubject.next(null);
      // Don't auto-redirect, let the signup page handle it
    } catch (error: any) {
      console.error('Signup error:', error.code, error.message);
      if (error.code === 'auth/configuration-not-found') {
        throw new Error('Firebase Authentication is not properly configured. Please enable Email/Password sign-in method in Firebase Console.');
      }
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    try {
      console.log('Attempting login for:', email);
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      
      console.log('User signed in:', userCredential.user.uid);
      const userData = await this.getUserData(userCredential.user.uid);
      console.log('User data retrieved:', userData);
      this.currentUserSubject.next(userData);
      
      if (userData) {
        await this.redirectByRole(userData.role);
      }
    } catch (error: any) {
      console.error('Login error:', error.code, error.message);
      if (error.code === 'auth/configuration-not-found') {
        throw new Error('Firebase Authentication is not properly configured. Please enable Email/Password sign-in method in Firebase Console.');
      }
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
    this.currentUserSubject.next(null);
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