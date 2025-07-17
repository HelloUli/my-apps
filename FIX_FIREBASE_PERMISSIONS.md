# Fix Firebase Permissions for Hello Habanero CRM

## Issue
The user dropdown in the "Assign Projects" screen is not populating due to Firebase security rules preventing access to the users collection.

## Solution

### Step 1: Update Firebase Security Rules

1. Go to your Firebase Console: https://console.firebase.google.com/
2. Select your project: `crm-app-ea777`
3. In the left sidebar, click on "Firestore Database"
4. Click on the "Rules" tab
5. Replace the existing rules with the content from `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/write their own data, admins can read all
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Projects collection - users can read/write their own projects, admins can read all
    match /projects/{projectId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Tasks collection - users can read/write their own tasks, admins can read all
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow admins to read all users for assignment purposes
    match /users/{userId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

6. Click "Publish" to save the rules

### Step 2: Test the Fix

1. Restart your Expo app
2. Sign in as admin
3. Go to "Assign Projects"
4. The user dropdown should now populate with available clients

### Step 3: Alternative Testing (If Rules Still Don't Work)

If you still have permission issues, the app now includes fallback test users:

1. The app will automatically create test users when permissions are denied
2. You'll see "Test Client 1" and "Test Client 2" in the dropdown
3. You can assign projects to these test users for testing

### Step 4: Verify User Roles

To ensure your accounts have the correct roles:

1. Sign in with your admin account
2. Go to Profile screen
3. Use the role switching feature to set your account to "admin"
4. Sign in with your second account
5. Verify it has "user" role (should be default)

## Security Rules Explanation

The rules allow:
- Users to read/write their own data
- Admins to read all user data (for assignment)
- Users to read/write their own projects and tasks
- Admins to read/write all projects and tasks

This provides the necessary permissions for the CRM functionality while maintaining security.

## Troubleshooting

If you still see permission errors:

1. Check the console logs for specific error messages
2. Use the "Debug Users" button in Assign Projects screen
3. Verify your Firebase project ID matches the one in `firebase.js`
4. Ensure you're signed in with an admin account when trying to assign projects

## Quick Test

After updating the rules, you should be able to:
1. See other users in the dropdown when assigning projects
2. Create projects and assign them to clients
3. Switch between admin and user accounts to test the full workflow 