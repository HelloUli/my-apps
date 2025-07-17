# Create Firebase Indexes

## Issue
The app is showing "The query requires an index" errors because Firestore needs composite indexes for complex queries.

## Solution: Create Required Indexes

### Step 1: Access Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select your project: `crm-app-ea777`
3. In the left sidebar, click on "Firestore Database"
4. Click on the "Indexes" tab

### Step 2: Create the Required Indexes

You need to create these composite indexes:

#### 1. Projects Collection Index
- **Collection ID**: `projects`
- **Fields to index**:
  - `userId` (Ascending)
  - `status` (Ascending) 
  - `createdAt` (Descending)

#### 2. Projects Collection Index (User Projects)
- **Collection ID**: `projects`
- **Fields to index**:
  - `userId` (Ascending)
  - `createdAt` (Descending)

#### 3. Tasks Collection Index
- **Collection ID**: `tasks`
- **Fields to index**:
  - `userId` (Ascending)
  - `status` (Ascending)
  - `createdAt` (Descending)

#### 4. Tasks Collection Index (User Tasks)
- **Collection ID**: `tasks`
- **Fields to index**:
  - `userId` (Ascending)
  - `createdAt` (Descending)

### Step 3: Quick Method - Use Error Links

The easiest way is to click the links in the error messages:

1. **For Projects Index**: Click this link from the error:
   ```
   https://console.firebase.google.com/v1/r/project/crm-app-ea777/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9jcm0tYXBwLWVhNzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wcm9qZWN0cy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC
   ```

2. **For Tasks Index**: Click this link from the error:
   ```
   https://console.firebase.google.com/v1/r/project/crm-app-ea777/firestore/indexes?create_composite=Cktwcm9qZWN0cy9jcm0tYXBwLWVhNzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90YXNrcy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC
   ```

### Step 4: Manual Index Creation

If the links don't work, create them manually:

1. Click "Create Index" button
2. Set Collection ID to `projects`
3. Add fields:
   - Field: `userId`, Order: `Ascending`
   - Field: `status`, Order: `Ascending` 
   - Field: `createdAt`, Order: `Descending`
4. Click "Create"

Repeat for the other indexes.

### Step 5: Wait for Index Creation
- Indexes take 1-5 minutes to build
- You'll see "Building" status initially
- Wait until status shows "Enabled"

### Step 6: Test the App
1. Restart your Expo app
2. The index errors should be resolved
3. Projects and tasks should load properly

## Alternative: Temporary Fix

If you want to test immediately without waiting for indexes, I can modify the services to use simpler queries. Let me know if you'd like me to do that.

## What These Indexes Do

- **Composite Indexes**: Allow Firestore to efficiently query multiple fields
- **Performance**: Make queries faster and more efficient
- **Required**: Firestore requires indexes for queries with multiple `where` clauses and `orderBy`

## Troubleshooting

- **Index still building**: Wait 1-5 minutes for completion
- **Still getting errors**: Clear app cache and restart
- **Wrong collection**: Make sure you're creating indexes for the right collection names 