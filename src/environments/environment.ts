// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

/**
 * FIREBASE AUTHENTICATION TROUBLESHOOTING:
 * 
 * If you get "auth/configuration-not-found" or login fails:
 * 
 * 1. Go to Firebase Console: https://console.firebase.google.com/
 * 2. Select project: surveyform-6c48b
 * 3. Go to Authentication → Sign-in method
 * 4. Enable "Email/Password" provider
 * 5. Click "Save"
 * 
 * If you still have issues:
 * - Check if project ID matches: surveyform-6c48b
 * - Verify authDomain is correct: surveyform-6c48b.firebaseapp.com
 * - Check browser console for detailed error messages
 * - Clear browser cache and try again
 * - Ensure internet connection is stable
 */

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyC0LEbqs7CtdWwa9rF7yv0IiyKm27Q_WTk",
    authDomain: "surveyform-6c48b.firebaseapp.com",
    projectId: "surveyform-6c48b",
    storageBucket: "surveyform-6c48b.firebasestorage.app",
    messagingSenderId: "314477273372",
    appId: "1:314477273372:web:96d17464a79ee1a650dad9",
    measurementId: "G-6PDVVW11BF"
  }
};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
