import { applicationDefault, cert, initializeApp, getApps, getApp } from "firebase-admin/app";
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
let firestoreInitializationAttempted = false;

export function initFirestoreDb(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;
  if (firestoreInitializationAttempted) return null;
  firestoreInitializationAttempted = true;
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    const canUseApplicationDefault = Boolean(
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.K_SERVICE
    );
    const appOptions: any = { projectId };
    if (serviceAccountJson) {
      appOptions.credential = cert(JSON.parse(serviceAccountJson));
    } else if (canUseApplicationDefault) {
      appOptions.credential = applicationDefault();
    }

    const adminApp = getApps().length === 0 ? initializeApp(appOptions) : getApp();
    if (!serviceAccountJson && !canUseApplicationDefault) {
      console.warn("Firestore sync disabled: Firebase Admin credentials are not configured. Local database fallback remains active.");
      return null;
    }
    if (databaseId) {
      firestoreInstance = getFirestore(adminApp, databaseId);
    } else {
      firestoreInstance = getFirestore(adminApp);
    }
    console.log("Firestore Admin initialized successfully with databaseId:", databaseId);
  } catch (err) {
    console.warn("Firestore Admin init notice:", err);
    if (getApps().length === 0) {
      try {
        initializeApp({ projectId });
      } catch {
        // Google authentication will report a clear error if app initialization also fails.
      }
    }
  }
  return firestoreInstance;
}

async function readCollectionWithTimeout(fsDb: Firestore, collectionName: string) {
  try {
    return await Promise.race([
      fsDb.collection(collectionName).get(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Firestore ${collectionName} read timed out`)), 8_000);
      })
    ]);
  } catch (err: any) {
    console.warn(`Firestore ${collectionName} read skipped:`, err?.message || err);
    return { docs: [] };
  }
}

export async function syncToFirestore(data: any) {
  const fsDb = initFirestoreDb();
  if (!fsDb) return;

  try {
    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        if (!u || !u.id) continue;
        const { password, ...safeUser } = u;
        await fsDb.collection("users").doc(u.id).set(safeUser, { merge: true }).catch(err => {
          console.warn("Firestore user sync warning:", err?.message || err);
        });
        if (typeof password === "string" && password) {
          await fsDb.collection("authCredentials").doc(u.id).set({ passwordHash: password }, { merge: true }).catch(err => {
            console.warn("Firestore credential sync warning:", err?.message || err);
          });
        }
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

    if (Array.isArray(data.communitySpots)) {
      for (const spot of data.communitySpots) {
        if (!spot || !spot.id) continue;
        await fsDb.collection("communitySpots").doc(spot.id).set(spot, { merge: true }).catch(err => {
          console.warn("Firestore communitySpot sync warning:", err?.message || err);
        });
      }
    }

    if (Array.isArray(data.battleHistory)) {
      for (const b of data.battleHistory) {
        if (!b || !b.id) continue;
        await fsDb.collection("battleHistory").doc(b.id).set(b, { merge: true }).catch(err => {
          console.warn("Firestore battleHistory sync warning:", err?.message || err);
        });
      }
    }

    if (Array.isArray(data.transactions)) {
      for (const tx of data.transactions) {
        if (!tx || !tx.id) continue;
        await fsDb.collection("transactions").doc(tx.id).set(tx, { merge: true }).catch(err => {
          console.warn("Firestore transaction sync warning:", err?.message || err);
        });
      }
    }

    if (Array.isArray(data.officialMails)) {
      for (const mail of data.officialMails) {
        if (!mail || !mail.id) continue;
        await fsDb.collection("officialMails").doc(mail.id).set(mail, { merge: true }).catch(err => {
          console.warn("Firestore officialMail sync warning:", err?.message || err);
        });
      }
    }

    if (Array.isArray(data.directMessages)) {
      for (const dm of data.directMessages) {
        if (!dm || !dm.id) continue;
        await fsDb.collection("directMessages").doc(dm.id).set(dm, { merge: true }).catch(err => {
          console.warn("Firestore directMessage sync warning:", err?.message || err);
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
    const [
      usersSnap,
      credentialsSnap,
      capturesSnap,
      cardsSnap,
      tradesSnap,
      communitySpotsSnap,
      battleHistorySnap,
      transactionsSnap,
      officialMailsSnap,
      directMessagesSnap
    ] = await Promise.all([
      readCollectionWithTimeout(fsDb, "users"),
      readCollectionWithTimeout(fsDb, "authCredentials"),
      readCollectionWithTimeout(fsDb, "captures"),
      readCollectionWithTimeout(fsDb, "cards"),
      readCollectionWithTimeout(fsDb, "trades"),
      readCollectionWithTimeout(fsDb, "communitySpots"),
      readCollectionWithTimeout(fsDb, "battleHistory"),
      readCollectionWithTimeout(fsDb, "transactions"),
      readCollectionWithTimeout(fsDb, "officialMails"),
      readCollectionWithTimeout(fsDb, "directMessages")
    ]);

    const passwordByUserId = new Map<string, string>(
      credentialsSnap.docs.map(doc => [doc.id, doc.data().passwordHash] as [string, string])
    );
    const users = usersSnap.docs.map(doc => {
      const user = doc.data();
      const password = passwordByUserId.get(doc.id);
      return password ? { ...user, password } : user;
    });
    const captures = capturesSnap.docs.map(doc => doc.data());
    const cards = cardsSnap.docs.map(doc => doc.data());
    const trades = tradesSnap.docs.map(doc => doc.data());
    const communitySpots = communitySpotsSnap.docs.map(doc => doc.data());
    const battleHistory = battleHistorySnap.docs.map(doc => doc.data());
    const transactions = transactionsSnap.docs.map(doc => doc.data());
    const officialMails = officialMailsSnap.docs.map(doc => doc.data());
    const directMessages = directMessagesSnap.docs.map(doc => doc.data());

    if (users.length === 0 && captures.length === 0 && cards.length === 0 && communitySpots.length === 0 && officialMails.length === 0) {
      return null;
    }

    return {
      users,
      captures,
      cards,
      trades,
      communitySpots,
      battleHistory,
      transactions,
      officialMails,
      directMessages
    };
  } catch (err) {
    console.warn("Could not load initial data from Firestore:", err);
    return null;
  }
}
