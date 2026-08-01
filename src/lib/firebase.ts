import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import appletConfig from "../../firebase-applet-config.json";

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || appletConfig.apiKey || "",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || "",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || "",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || "",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || "",
  appId: metaEnv.VITE_FIREBASE_APP_ID || appletConfig.appId || ""
};

const databaseId = metaEnv.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId || undefined;

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Local Storage Persistence & Backup Helpers
const LOCAL_STORAGE_BACKUP_KEY = "nekomon_player_history_v2";

export interface LocalHistoryBackup {
  user: any;
  captures: any[];
  cards: any[];
  trades: any[];
  lastSavedAt: string;
}

export function saveHistoryToLocalStorage(user: any, captures: any[], cards: any[], trades: any[] = []) {
  if (!user || !user.id) return;
  try {
    const backup: LocalHistoryBackup = {
      user,
      captures: captures || [],
      cards: cards || [],
      trades: trades || [],
      lastSavedAt: new Date().toISOString()
    };
    localStorage.setItem(`${LOCAL_STORAGE_BACKUP_KEY}_${user.id}`, JSON.stringify(backup));
    localStorage.setItem("nekomon_last_active_user_id", user.id);
  } catch (e) {
    console.warn("Failed to save local player history backup:", e);
  }
}

export function getHistoryFromLocalStorage(userId?: string): LocalHistoryBackup | null {
  try {
    const idToLoad = userId || localStorage.getItem("nekomon_last_active_user_id");
    if (!idToLoad) return null;
    const raw = localStorage.getItem(`${LOCAL_STORAGE_BACKUP_KEY}_${idToLoad}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to read local player history backup:", e);
    return null;
  }
}

export function clearHistoryFromLocalStorage(userId?: string) {
  try {
    if (userId) {
      localStorage.removeItem(`${LOCAL_STORAGE_BACKUP_KEY}_${userId}`);
    }
  } catch (e) {}
}

export async function signInWithGoogleFirebase() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Google Sign-In error:", error);
    throw error;
  }
}
