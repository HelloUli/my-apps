# Firebase Indexes Deployment Instructions

## Problem
Your app is getting Firebase index errors because some queries use multiple `where` clauses with `orderBy`, which require composite indexes.

## Solution
Deploy the required indexes using Firebase CLI.

## Steps

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase in your project (if not already done)
```bash
firebase init firestore
```

### 4. Deploy the indexes
```bash
firebase deploy --only firestore:indexes
```

## Alternative: Manual Index Creation

If the above doesn't work, you can create indexes manually in the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database
4. Click on "Indexes" tab
5. Click "Add Index"
6. Create the following indexes:

### Projects Collection Indexes:
- **Collection ID:** `projects`
- **Fields:** 
  - `assigned_user_id` (Ascending)
  - `createdAt` (Descending)

- **Collection ID:** `projects`
- **Fields:**
  - `assigned_user_id` (Ascending)
  - `status` (Ascending)
  - `createdAt` (Descending)

### Tasks Collection Indexes:
- **Collection ID:** `tasks`
- **Fields:**
  - `assigned_user_id` (Ascending)
  - `status` (Ascending)
  - `createdAt` (Descending)

- **Collection ID:** `tasks`
- **Fields:**
  - `assigned_user_id` (Ascending)
  - `createdAt` (Descending)

- **Collection ID:** `tasks`
- **Fields:**
  - `project_id` (Ascending)
  - `createdAt` (Descending)

### Users Collection Indexes:
- **Collection ID:** `users`
- **Fields:**
  - `role` (Ascending)
  - `fullName` (Ascending)

## Notes
- Index creation can take a few minutes
- You'll see "Index not ready" errors until indexes are fully built
- The app has fallback logic to handle index errors gracefully 