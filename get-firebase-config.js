// This script helps you get the complete Firebase configuration
// Run this in your browser console on the Firebase Console page

console.log(`
To get your complete Firebase configuration:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: crm-app-ea777
3. Click the gear icon (⚙️) next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you don't see a web app, click the web icon (</>) to add one
7. Copy the entire config object

Your current config (partial):
{
  apiKey: "AIzaSyC6749kNDGisgKY1qIdUcMsrjSBuqF4Fao",
  authDomain: "crm-app-ea777.firebaseapp.com",
  projectId: "crm-app-ea777",
  storageBucket: "crm-app-ea777.appspot.com",
  messagingSenderId: "174934345835",
  appId: "NEED_TO_GET_FROM_CONSOLE"
}

Once you have the complete config, update the firebase.js file with the appId.
`); 