# Firebase Setup Guide for Hello Habanero CRM

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: "Hello Habanero CRM"
4. Follow the setup wizard

## Step 2: Enable Authentication

1. In Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

## Step 3: Create Firestore Database

1. In Firebase Console, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Click "Done"

## Step 4: Set up Storage

1. In Firebase Console, go to "Storage" in the left sidebar
2. Click "Get started"
3. Choose "Start in test mode" (for development)
4. Select the same location as Firestore
5. Click "Done"

## Step 5: Get Firebase Configuration

1. In Firebase Console, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "Hello Habanero CRM Web")
6. Copy the configuration object

## Step 6: Update Firebase Configuration

1. Open `firebase.js` in your project
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 7: Set up Firestore Security Rules

1. In Firebase Console, go to "Firestore Database" → "Rules"
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add more collections as needed
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 8: Set up Storage Security Rules

1. In Firebase Console, go to "Storage" → "Rules"
2. Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only upload to their own profile pictures
    match /profile-pictures/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add more rules as needed
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 9: Test the App

1. Make sure your Expo development server is running
2. Scan the QR code with Expo Go app
3. Try creating an account and logging in
4. Test the profile picture upload functionality

## Collections Structure

The app will automatically create the following Firestore collections:

### Users Collection
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

## Next Steps

Once Firebase is configured, you can:

1. Add more collections for clients, projects, tasks, etc.
2. Implement real-time data synchronization
3. Add push notifications
4. Set up analytics
5. Configure production security rules

## Troubleshooting

- **Authentication errors**: Make sure Email/Password auth is enabled
- **Firestore errors**: Check security rules and database location
- **Storage errors**: Verify storage rules and bucket permissions
- **Configuration errors**: Double-check your Firebase config values

## Security Notes

- The current rules allow authenticated users to access all data
- For production, implement more restrictive rules based on user roles
- Consider implementing data validation and sanitization
- Regularly review and update security rules 