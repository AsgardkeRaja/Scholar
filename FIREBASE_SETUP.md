# Firebase Setup Guide

## Prerequisites
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password and Google Sign-In
3. Create a Firestore database

## Configuration Steps

### 1. Get Firebase Configuration
1. Go to Project Settings in Firebase Console
2. Under "Your apps", click the web icon (`</>`)
3. Register your app and copy the configuration values

### 2. Set Environment Variables

#### For Local Development
Create a `.env` file in the root directory with:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

#### For Vercel Deployment
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add all the `NEXT_PUBLIC_FIREBASE_*` variables
4. Make sure to add them for all environments (Production, Preview, Development)

### 3. Firestore Security Rules
Set up the following security rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own bookmarks
    match /users/{userId}/bookmarks/{bookmark} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Authentication Setup
1. In Firebase Console, go to Authentication
2. Enable Email/Password sign-in method
3. Enable Google sign-in method
4. Add your domain to authorized domains (for production)

## Troubleshooting

### Build Errors on Vercel
If you see `auth/invalid-api-key` errors during build:
- Make sure all environment variables are set in Vercel
- Environment variables must start with `NEXT_PUBLIC_` to be available in the browser
- Redeploy after adding environment variables

### Authentication Not Working
- Check that your domain is added to Firebase authorized domains
- Verify all environment variables are correctly set
- Check browser console for specific error messages
