# App Template for New Projects

Use this template when creating new apps in the `my-apps` repository.

## Required Files Structure

```
app-name/
├── screens/              # UI screens
│   ├── AuthScreen.js
│   ├── DashboardScreen.js
│   └── ProfileScreen.js
├── services/             # API and external services
│   ├── authService.js
│   └── apiService.js
├── constants/            # App constants
│   ├── colors.js
│   └── config.js
├── assets/              # Static assets
│   ├── icon.png
│   └── splash.png
├── App.js               # Main app component
├── package.json         # Dependencies
├── app.json            # Expo configuration
├── eas.json            # EAS Build configuration
├── firebase.js         # Firebase setup (if using Firebase)
├── .gitignore          # Git ignore rules
└── README.md           # App documentation
```

## Required .gitignore Rules

```
# Dependencies
node_modules/

# Expo
.expo/
dist/
web-build/

# Build artifacts
*.aab
*.apk
*.ipa

# Credentials (keep locally)
*-credentials.json
*.json.key
*.p8
*.p12
*.jks

# Debug
npm-debug.*
yarn-debug.*
yarn-error.*

# OS
.DS_Store
*.pem

# Environment
.env*
```

## Setup Checklist

- [ ] Initialize Expo project
- [ ] Set up Firebase (if needed)
- [ ] Configure EAS Build
- [ ] Create basic screens
- [ ] Set up navigation
- [ ] Add authentication
- [ ] Configure .gitignore
- [ ] Create README.md
- [ ] Test build process

## Naming Convention

- App folders: `kebab-case` (e.g., `my-app-name`)
- Files: `PascalCase` for components, `camelCase` for utilities
- Branches: `feature/description` or `fix/description` 