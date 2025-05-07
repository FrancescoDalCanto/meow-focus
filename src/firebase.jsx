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
// - I valori vengono recuperati dalle variabili ambiente (import.meta.env) per sicurezza e flessibilità
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,               // Chiave API di Firebase
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,       // Dominio di autenticazione
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,         // ID del progetto Firebase
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // Bucket per lo storage dei file
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, // ID per invio messaggi
  appId: import.meta.env.VITE_FIREBASE_APP_ID,                 // ID dell'app Firebase
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID  // ID per Google Analytics (opzionale)
};

// Inizializza Firebase utilizzando le configurazioni sopra
const app = initializeApp(firebaseConfig);

// Inizializza il servizio di autenticazione di Firebase
const auth = getAuth(app);

// Crea un provider per l'autenticazione tramite Google
const googleProvider = new GoogleAuthProvider();

// Inizializza il database Firestore per l'app
const db = getFirestore(app);

// Imposta la persistenza della sessione di autenticazione
// - browserSessionPersistence mantiene l'utente connesso fino alla chiusura della finestra/tab
setPersistence(auth, browserSessionPersistence).catch((error) => {
  // Se la configurazione fallisce → registra l'errore in console
  console.error("Errore nella configurazione della persistenza:", error);
});

/**
 * Funzione asincrona per eseguire il login con Google
 * - Tenta di eseguire il login tramite popup
 * - Se il popup è bloccato o chiuso dall'utente → esegue il fallback con redirect
 */
async function signInWithGoogle() {
  try {
    // Prova ad autenticare l'utente con un popup
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    // Se il popup è stato bloccato o chiuso dall'utente → effettua il login tramite redirect
    if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
      console.warn("Popup bloccato, eseguo redirect");
      return await signInWithRedirect(auth, googleProvider);
    } else {
      // Per tutti gli altri errori → rilancia l'errore
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