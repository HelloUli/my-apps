# Firebase Setup for Hello Habanero CRM

## Your Project Details
- **Project ID**: crm-app-ea777
- **Project Number**: 174934345835
- **API Key**: AIzaSyC6749kNDGisgKY1qIdUcMsrjSBuqF4Fao

## Step 1: Get Complete Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **crm-app-ea777**
3. Click gear icon (⚙️) → "Project settings"
4. Scroll to "Your apps" section
5. If no web app exists, click web icon (</>) → "Register app"
6. App nickname: "Hello Habanero CRM Web"
7. Copy the complete config object

## Step 2: Update firebase.js

Replace the `appId` in `firebase.js` with the one from your config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC6749kNDGisgKY1qIdUcMsrjSBuqF4Fao",
  authDomain: "crm-app-ea777.firebaseapp.com",
  projectId: "crm-app-ea777",
  storageBucket: "crm-app-ea777.appspot.com",
  messagingSenderId: "174934345835",
  appId: "YOUR_ACTUAL_APP_ID_HERE" // ← Replace this
};
```

## Step 3: Enable Authentication

1. In Firebase Console → "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Click "Save"

## Step 4: Create Firestore Database

1. In Firebase Console → "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode"
4. Select location: **us-central1** (recommended)
5. Click "Done"

## Step 5: Set up Storage

1. In Firebase Console → "Storage"
2. Click "Get started"
3. Choose "Start in test mode"
4. Select location: **us-central1**
5. Click "Done"

## Step 6: Configure Security Rules

### Firestore Rules
Go to "Firestore Database" → "Rules" and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to access other collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage Rules
Go to "Storage" → "Rules" and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only upload to their own profile pictures
    match /profile-pictures/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to access other files
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 7: Test the App

1. Make sure Expo is running: `npx expo start`
2. Scan QR code with Expo Go
3. Try creating an account
4. Test login/logout functionality
5. Test profile picture upload

## Expected Collections

The app will create these Firestore collections:

```
users/{userId}
├── uid: string
├── email: string
├── fullName: string
├── businessName: string
├── phoneNumber: string
├── role: string (user/admin)
├── profilePicture: string (URL)
├── createdAt: timestamp
└── updatedAt: timestamp
```

## Troubleshooting

- **"Firebase App named '[DEFAULT]' already exists"**: This is normal, the app handles it
- **Authentication errors**: Make sure Email/Password is enabled
- **Storage errors**: Check storage rules and bucket permissions
- **Firestore errors**: Verify database location and rules

## Next Steps

Once working, you can add:
- Clients collection
- Projects collection
- Tasks collection
- Analytics tracking
- Push notifications 