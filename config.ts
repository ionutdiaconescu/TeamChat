// config.ts
// Firebase configuration; values can be provided via environment variables
// Vite exposes import.meta.env.VITE_* vars to the client bundle, whereas
// on the server (Node/Render) we read from process.env.

const getEnv = (key: string, fallback?: string) => {
  // Node environment
  if (typeof process !== "undefined" && process.env[key] !== undefined) {
    return process.env[key]!;
  }
  // Vite environment (client)
  // @ts-ignore
  return import.meta.env[key] || fallback;
};

const firebaseConfig = {
  apiKey: getEnv(
    "VITE_FIREBASE_API_KEY",
    "AIzaSyBH5UohN5W0656sfinYKfBA84WvD3gZk6E",
  ),
  authDomain: getEnv(
    "VITE_FIREBASE_AUTH_DOMAIN",
    "teamchat-888f2.firebaseapp.com",
  ),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "teamchat-888f2"),
  storageBucket: getEnv(
    "VITE_FIREBASE_STORAGE_BUCKET",
    "teamchat-888f2.appspot.com",
  ),
  messagingSenderId: getEnv(
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "559922663027",
  ),
  appId: getEnv(
    "VITE_FIREBASE_APP_ID",
    "1:559922663027:web:b766cca89832cd5fe92406",
  ),
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID", "G-5FTXP89Y9D"),
};

export default { firebase: firebaseConfig };
