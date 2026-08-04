import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let appletConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    appletConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (e) {
  console.log("Could not load firebase-applet-config.json:", e);
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || "gen-lang-client-0718427651";
const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId;

let firestoreInstance: Firestore | null = null;

export function initFirestoreDb(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;
  try {
    const adminApp = getApps().length === 0 ? initializeApp({ projectId }) : getApp();
    if (databaseId) {
      firestoreInstance = getFirestore(adminApp, databaseId);
    } else {
      firestoreInstance = getFirestore(adminApp);
    }
    console.log("Firestore Admin initialized successfully with databaseId:", databaseId);
  } catch (err) {
    console.warn("Firestore Admin init notice:", err);
  }
  return firestoreInstance;
}

export async function syncToFirestore(data: any) {
  const fsDb = initFirestoreDb();
  if (!fsDb) return;

  try {
    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        if (!u || !u.id) continue;
        await fsDb.collection("users").doc(u.id).set(u, { merge: true }).catch(err => {
          console.warn("Firestore user sync warning:", err?.message || err);
        });
      }
    }

    if (Array.isArray(data.captures)) {
      for (const c of data.captures) {
        if (!c || !c.id) continue;
        await fsDb.collection("captures").doc(c.id).set(c, { merge: true }).catch(err => {
          console.warn("Firestore capture sync warning:", err?.message || err);
        });
      }
    }

    if (Array.isArray(data.cards)) {
      for (const card of data.cards) {
        if (!card || !card.id) continue;
        await fsDb.collection("cards").doc(card.id).set(card, { merge: true }).catch(err => {
          console.warn("Firestore card sync warning:", err?.message || err);
        });
      }
    }

    if (Array.isArray(data.trades)) {
      for (const t of data.trades) {
        if (!t || !t.id) continue;
        await fsDb.collection("trades").doc(t.id).set(t, { merge: true }).catch(err => {
          console.warn("Firestore trade sync warning:", err?.message || err);
        });
      }
    }
  } catch (err: any) {
    console.warn("Firestore sync skipped due to permissions/connectivity:", err?.message || err);
  }
}

export async function loadFromFirestore(): Promise<any | null> {
  const fsDb = initFirestoreDb();
  if (!fsDb) return null;

  try {
    const usersSnap = await fsDb.collection("users").get();
    const capturesSnap = await fsDb.collection("captures").get();
    const cardsSnap = await fsDb.collection("cards").get();
    const tradesSnap = await fsDb.collection("trades").get();

    const users = usersSnap.docs.map(doc => doc.data());
    const captures = capturesSnap.docs.map(doc => doc.data());
    const cards = cardsSnap.docs.map(doc => doc.data());
    const trades = tradesSnap.docs.map(doc => doc.data());

    if (users.length === 0 && captures.length === 0 && cards.length === 0) {
      return null;
    }

    return {
      users,
      captures,
      cards,
      trades
    };
  } catch (err) {
    console.warn("Could not load initial data from Firestore:", err);
    return null;
  }
}
