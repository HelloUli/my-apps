# 🔥 Quick Firebase Setup to Fix Authentication Error

## The "An error occurred" message means Firebase services aren't set up yet.

### ✅ Step 1: Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **crm-app-ea777**
3. Click **"Authentication"** in left sidebar
4. Click **"Get started"**
5. Go to **"Sign-in method"** tab
6. Click **"Email/Password"**
7. Toggle **"Enable"** to ON
8. Click **"Save"**

### ✅ Step 2: Create Firestore Database
1. In Firebase Console, click **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"**
4. Select location: **us-central1** (recommended)
5. Click **"Done"**

### ✅ Step 3: Enable Storage
1. In Firebase Console, click **"Storage"**
2. Click **"Get started"**
3. Choose **"Start in test mode"**
4. Select location: **us-central1**
5. Click **"Done"**

### ✅ Step 4: Test the App
1. Go back to your Expo app
2. Try creating a new account (not signing in)
3. Use a test email like: `test@example.com`
4. Use a password like: `password123`

## 🚨 Most Common Issues:

1. **"User not found"** - Try creating a new account first
2. **"Permission denied"** - Make sure Firestore is in test mode
3. **"Network error"** - Check your internet connection
4. **"Invalid email"** - Use a valid email format

## 🎯 Try This First:
1. **Create a new account** instead of signing in
2. Use: `test@habanero.com` / `password123`
3. This will create the user in Firebase
4. Then try signing in with the same credentials

## 📱 After Setup:
- The app will work perfectly
- Users can create accounts and log in
- Profile pictures can be uploaded
- All data will be saved to Firebase 