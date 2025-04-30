import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  browserSessionPersistence,
  setPersistence,
  updateProfile
} from "firebase/auth";
import { getFirestore, getDoc } from "firebase/firestore"; // <-- qui correttamente importi anche getDoc

// Configurazioni chiavi firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

// Imposta la persistenza all'avvio
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.error("Errore nella configurazione della persistenza:", error);
});

// Funzione di login con Google con fallback a redirect
async function signInWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
      console.warn("Popup bloccato, eseguo redirect");
      return await signInWithRedirect(auth, googleProvider);
    } else {
      throw error;
    }
  }
}

// Esportazione
export {
  auth,
  signInWithEmailAndPassword,
  signInWithGoogle,
  googleProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  db,
  getDoc // <-- Se vuoi puoi anche esportarlo qui se ti serve fuori
};