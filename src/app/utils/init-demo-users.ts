/**
 * DEMO USER INITIALIZATION SCRIPT
 * Run this once to create demo users in Firebase
 * Call from browser console: initDemoUsers()
 */

import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';

export interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'seller' | 'customer';
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'admin@campus.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  },
  {
    email: 'seller@campus.com',
    password: 'seller123',
    name: 'Seller Demo',
    role: 'seller'
  },
  {
    email: 'customer@campus.com',
    password: 'customer123',
    name: 'Customer Demo',
    role: 'customer'
  }
];

export async function createDemoUser(
  auth: Auth, 
  firestore: Firestore, 
  demoUser: DemoUser
): Promise<string> {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      demoUser.email,
      demoUser.password
    );

    // Create Firestore document
    await setDoc(doc(firestore, 'users', userCredential.user.uid), {
      userId: userCredential.user.uid,
      email: demoUser.email,
      name: demoUser.name,
      role: demoUser.role,
      dateJoined: serverTimestamp(),
      isActive: true
    });

    return `✅ Created ${demoUser.role}: ${demoUser.email}`;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      return `⚠️ ${demoUser.role} already exists: ${demoUser.email}`;
    }
    throw error;
  }
}

export async function initAllDemoUsers(auth: Auth, firestore: Firestore): Promise<void> {
  console.log('🚀 Initializing demo users...');
  
  for (const demoUser of DEMO_USERS) {
    try {
      const result = await createDemoUser(auth, firestore, demoUser);
      console.log(result);
    } catch (error: any) {
      console.error(`❌ Failed to create ${demoUser.role}:`, error.message);
    }
  }
  
  console.log('✨ Demo users initialization complete!');
  console.log('\nYou can now login with:');
  console.log('Admin: admin@campus.com / admin123');
  console.log('Seller: seller@campus.com / seller123');
  console.log('Customer: customer@campus.com / customer123');
}
