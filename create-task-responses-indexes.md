# Firebase Indexes for Task Responses Collection

You need to create the following composite indexes in your Firebase Console for the `task_responses` collection:

## Required Indexes

### 1. Task Responses by Task ID (for getting responses for a specific task)
- **Collection**: `task_responses`
- **Fields**:
  - `task_id` (Ascending)
  - `submitted_at` (Descending)

### 2. Task Responses by User ID (for getting responses from a specific user)
- **Collection**: `task_responses`
- **Fields**:
  - `user_id` (Ascending)
  - `submitted_at` (Descending)

### 3. All Task Responses (for admin view)
- **Collection**: `task_responses`
- **Fields**:
  - `submitted_at` (Descending)

## How to Create Indexes

1. Go to your Firebase Console
2. Navigate to Firestore Database
3. Click on the "Indexes" tab
4. Click "Create Index"
5. Select the collection and fields as specified above
6. Click "Create"

## Index Status

After creating the indexes, they will show as "Building" status. This process can take a few minutes to complete. Once the status changes to "Enabled", your queries will work properly.

## Testing

You can test the indexes by:
1. Creating a task response through the app
2. Checking if it appears in the admin notifications
3. Verifying that the response data is properly stored and retrieved

## Troubleshooting

If you see index errors in the console:
1. Make sure all required indexes are created
2. Wait for indexes to finish building
3. Check that the field names match exactly (case-sensitive)
4. Restart the app after indexes are enabled 