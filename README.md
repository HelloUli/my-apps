# Hello Habanero CRM

A React Native CRM application built with Expo and Firebase.

## App Structure

```
hellohabanero-crm/
├── screens/           # UI screens and components
├── services/          # Firebase and API services
├── constants/         # App constants and configurations
├── assets/           # Images, icons, and static assets
├── App.js            # Main app component
├── package.json      # Dependencies
├── app.json          # Expo configuration
├── eas.json          # EAS Build configuration
└── firebase.js       # Firebase initialization
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Firebase:
   - Place your Firebase credentials in `hello-habanero-app-daf6106be09a.json`
   - Update Firebase configuration in `firebase.js`

3. Run the app:
   ```bash
   npx expo start
   ```

## Building

- **Android**: `eas build --platform android`
- **iOS**: `eas build --platform ios`

## Development Notes

- Firebase credentials are kept locally and not pushed to Git
- Build artifacts (.aab, .apk) are excluded from version control
- Test files are in the root directory for debugging

## Future App Structure

For organizing multiple apps in the future:

```
my-apps/
├── hellohabanero-crm/     # Current CRM app
├── app2-name/             # Future app 2
├── app3-name/             # Future app 3
└── shared/                # Shared components and utilities
    ├── components/
    ├── utils/
    └── constants/
``` 