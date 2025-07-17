# 🔥 Complete Firebase Setup for Hello Habanero CRM

## 📋 What We Need to Set Up

1. **Authentication** - User login/signup
2. **Firestore Database** - User data, clients, projects, tasks
3. **Storage** - Profile pictures and documents
4. **Security Rules** - Data protection

---

## ✅ Step 1: Enable Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **crm-app-ea777**
3. Click **"Authentication"** in left sidebar
4. Click **"Get started"**
5. Go to **"Sign-in method"** tab
6. Click **"Email/Password"**
7. Toggle **"Enable"** to ON
8. Click **"Save"**

---

## ✅ Step 2: Create Firestore Database

1. In Firebase Console, click **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add security rules later)
4. Select location: **us-central1** (recommended)
5. Click **"Done"**

---

## ✅ Step 3: Enable Storage

1. In Firebase Console, click **"Storage"**
2. Click **"Get started"**
3. Choose **"Start in test mode"**
4. Select location: **us-central1**
5. Click **"Done"**

---

## 📊 Collections & Schema Setup

The app will automatically create these collections when users sign up and use the app:

### 1. **Users Collection** (`users/{userId}`)
```javascript
{
  uid: "string",                    // Firebase Auth UID
  email: "string",                  // User email
  fullName: "string",               // User's full name
  businessName: "string",           // Business name
  phoneNumber: "string",            // Phone number
  role: "user" | "admin",           // User role
  profilePicture: "string" | null,  // Profile picture URL
  createdAt: "timestamp",           // Account creation date
  updatedAt: "timestamp"            // Last update date
}
```

### 2. **Clients Collection** (`clients/{clientId}`)
```javascript
{
  id: "string",                     // Auto-generated ID
  userId: "string",                 // Owner user ID
  name: "string",                   // Client name
  email: "string",                  // Client email
  phone: "string",                  // Client phone
  company: "string",                // Company name
  address: "string",                // Address
  status: "active" | "inactive",    // Client status
  notes: "string",                  // Notes about client
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 3. **Projects Collection** (`projects/{projectId}`)
```javascript
{
  id: "string",                     // Auto-generated ID
  userId: "string",                 // Owner user ID
  clientId: "string",               // Associated client ID
  title: "string",                  // Project title
  description: "string",            // Project description
  status: "planning" | "in-progress" | "completed" | "on-hold",
  priority: "low" | "medium" | "high",
  startDate: "timestamp",
  dueDate: "timestamp",
  budget: "number",                 // Project budget
  progress: "number",               // Progress percentage (0-100)
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 4. **Tasks Collection** (`tasks/{taskId}`)
```javascript
{
  id: "string",                     // Auto-generated ID
  userId: "string",                 // Owner user ID
  projectId: "string",              // Associated project ID
  title: "string",                  // Task title
  description: "string",            // Task description
  status: "todo" | "in-progress" | "completed",
  priority: "low" | "medium" | "high",
  assignedTo: "string",             // Assigned user ID
  dueDate: "timestamp",
  completedAt: "timestamp",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

---

## 🔒 Security Rules Setup

### Firestore Security Rules
Go to **"Firestore Database"** → **"Rules"** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can access their own clients
    match /clients/{clientId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Users can access their own projects
    match /projects/{projectId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Users can access their own tasks
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Allow authenticated users to create new documents
    match /{document=**} {
      allow create: if request.auth != null;
    }
  }
}
```

### Storage Security Rules
Go to **"Storage"** → **"Rules"** and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only upload to their own profile pictures
    match /profile-pictures/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can upload documents to their own folder
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to access other files
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🧪 Test the Setup

1. **Create a test account**:
   - Email: `test@habanero.com`
   - Password: `password123`
   - Full Name: `Test User`
   - Business: `Hello Habanero Test`

2. **Check Firestore**:
   - Go to Firestore Database
   - You should see a `users` collection
   - Your test user document should be there

3. **Test profile picture upload**:
   - Go to Profile screen
   - Try uploading a photo
   - Check Storage for the uploaded file

---

## 🎯 What Happens When You Use the App

1. **User signs up** → Creates document in `users` collection
2. **User logs in** → Reads from `users` collection
3. **User updates profile** → Updates `users` document
4. **User uploads photo** → Saves to Storage, updates `users` document
5. **User creates clients/projects/tasks** → Creates documents in respective collections

---

## 🚨 Troubleshooting

- **"Permission denied"** → Check security rules
- **"User not found"** → Try creating account first
- **"Storage error"** → Check Storage rules
- **"Network error"** → Check internet connection

---

## 📱 Next Steps After Setup

Once this is working, we can add:
- Client management screens
- Project tracking
- Task management
- Analytics dashboard
- Push notifications 