# Update Firebase Security Rules

## Issue
The app is showing "Missing or insufficient permissions" errors because the current Firebase security rules are too restrictive.

## Solution: Manual Update via Firebase Console

### Step 1: Access Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select your project: `crm-app-ea777`
3. In the left sidebar, click on "Firestore Database"
4. Click on the "Rules" tab

### Step 2: Replace the Rules
Copy and paste the following rules into the Firebase console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user is accessing their own data
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // Users collection - users can read/write their own data, admins can read all
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      allow read: if isAdmin();
    }
    
    // Projects collection - users can read/write their own projects, admins can read/write all
    match /projects/{projectId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // Tasks collection - users can read/write their own tasks, admins can read/write all
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || isAdmin());
    }
  }
}
```

### Step 3: Publish the Rules
1. Click the "Publish" button
2. Wait for the rules to be deployed (usually takes a few seconds)

### Step 4: Test the App
1. Restart your Expo app
2. The permission errors should be resolved
3. Admins should now be able to see all projects and tasks
4. Users should be able to see their own data

## What These Rules Do

- **Users**: Can read/write their own user data
- **Admins**: Can read all user data (for assignment purposes)
- **Projects**: Users can access their own projects, admins can access all
- **Tasks**: Users can access their own tasks, admins can access all

## Alternative: Temporary Permissive Rules

If you want to test quickly, you can use these more permissive rules (NOT recommended for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **Warning**: The permissive rules above allow any authenticated user to read/write all data. Only use for testing!

## Troubleshooting

If you still see permission errors after updating:

1. **Clear app cache**: Close and reopen the Expo app
2. **Check user role**: Make sure your account has the correct role (admin/user)
3. **Verify authentication**: Ensure you're properly signed in
4. **Check console logs**: Look for specific error messages

## Next Steps

After fixing the permissions:
1. Test creating projects and tasks
2. Test the assign projects functionality
3. Verify admin and user views work correctly
4. Consider implementing more granular permissions for production 