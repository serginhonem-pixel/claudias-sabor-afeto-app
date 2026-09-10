import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage, connectStorageEmulator } from "firebase/storage";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const hasConfig = apiKey && apiKey !== "sua_api_key_aqui" && apiKey.length > 10;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (hasConfig) {
  const firebaseConfig = {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Local-only: point the SDK at the Firebase Emulator Suite instead of
  // production when NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true. Never set in
  // deployed environments — this block is a no-op there.
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" && typeof window !== "undefined") {
    const g = globalThis as unknown as { __firebaseEmulatorsConnected?: boolean };
    if (!g.__firebaseEmulatorsConnected) {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
      connectStorageEmulator(storage, "127.0.0.1", 9199);
      g.__firebaseEmulatorsConnected = true;
    }
  }
}

export { auth, db, storage };
export default app;

// ─── FIREBASE STORAGE UPLOAD ─────────────────────────────────────────────────
export async function uploadFotoProduto(contaId: string, produtoId: string, file: File): Promise<string> {
  if (!storage) throw new Error("Storage não configurado");
  const filePath = `contas/${contaId}/produtos/${produtoId}/${file.name}`;
  const storageRef = ref(storage, filePath);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return url;
}
