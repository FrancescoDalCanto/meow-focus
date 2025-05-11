import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// Crea il contesto di autenticazione
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Stato che memorizza l'utente attualmente autenticato (null se non autenticato)
  const [currentUser, setCurrentUser] = useState(null);
  // Stato che indica se l'autenticazione è in fase di caricamento
  const [loading, setLoading] = useState(true);
  // Stato che memorizza eventuali errori durante il processo di autenticazione
  const [error, setError] = useState(null);

  /**
   * useEffect → viene eseguito una volta al montaggio del componente
   * - Si iscrive agli aggiornamenti sullo stato di autenticazione tramite onAuthStateChanged di Firebase
   * - Aggiorna gli stati currentUser, loading ed error in base ai cambiamenti
   */
  useEffect(() => {
    // Si sottoscrive ai cambiamenti dello stato di autenticazione
    const unsubscribe = onAuthStateChanged(
      auth,

      // Callback → viene chiamata quando lo stato di autenticazione cambia (es. login, logout)
      (user) => {
        setCurrentUser(user); // Imposta l'utente autenticato o null
        setLoading(false);    // Fine caricamento
        setError(null);       // Pulisce eventuali errori precedenti
      },

      // Callback → viene chiamata in caso di errore durante il recupero dello stato di autenticazione
      (err) => {
        console.error("Errore di autenticazione:", err);
        setError("Errore durante l'autenticazione. Riprova più tardi.");
        setLoading(false); // Fine caricamento anche in caso di errore
      }
    );

    // Cleanup → rimuove la sottoscrizione quando il componente si smonta
    return () => unsubscribe();
  }, []); // Dipendenza vuota → eseguito solo al montaggio

  // Oggetto contenente i dati del contesto di autenticazione
  const contextValue = {
    currentUser, // Utente autenticato
    loading,     // Stato di caricamento
    error        // Eventuali errori
  };


  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personalizzato per accedere al contesto di autenticazione
export const useAuth = () => {
  const context = useContext(AuthContext);

  // Se il context non è disponibile → genera un errore (useAuth deve essere usato solo all'interno di AuthProvider)
  if (!context) {
    throw new Error("useAuth deve essere usato dentro AuthProvider");
  }

  // Restituisce i dati del contesto (currentUser, loading, error)
  return context;
};