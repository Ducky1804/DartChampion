# DartChampion

A Svelte + Vite app styled with TailwindCSS and DaisyUI, using Firebase for Auth and Firestore for data. Features login/register, championship setup, results entry, and leaderboard.

## Setup

1. Install dependencies

```bash
npm install
```

2. Create a Firebase project and enable Email/Password authentication. Create a Firestore database (in test mode for dev).

3. Create a `.env` file with your Firebase config (Vite env vars):

```bash
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

4. Start the dev server

```bash
npm run dev
```

## Notes
- Use the Setup page to create a championship and copy the generated ID.
- Use the Results page to enter scores under that championship ID.
- Leaderboard aggregates scores by player for a championship.
