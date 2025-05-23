import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyEmailWithGhostMail } from "./GhostMail";

import {
  auth,
  signInWithEmailAndPassword,
  signInWithGoogle,
  createUserWithEmailAndPassword,
  updateProfile,
} from "./firebase.jsx";
import { useRedirect } from "./RedirectContext";

const Popup = ({ type, onClose }) => {
  // Stati per memorizzare i dati del form (email, password, nome utente)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  // Stato per indicare se è in corso un'operazione di autenticazione (usato per disabilitare il form o mostrare loader)
  const [loading, setLoading] = useState(false);
  // Stato per memorizzare eventuali errori 
  const [error, setError] = useState("");
  // Stato per il tipo di form (es. login o registrazione) inizializzato con il valore passato come prop "type"
  const [formType, setFormType] = useState(type);
  // Hook per la navigazione tra pagine (React Router)
  const navigate = useNavigate();
  // Recupera dal contesto redirect le informazioni per reindirizzare l'utente dopo il login/registrazione
  const { redirectSessionId, setRedirectSessionId } = useRedirect();

  /**
   * Funzione generica per eseguire un'azione di autenticazione (es. login o registrazione)
   * - Gestisce il caricamento, l'eventuale redirect post-autenticazione e gli errori
   */
  const handleAuthAction = async (authFunction) => {
    setLoading(true);
    setError("");

    try {
      await authFunction(); // Esegue la funzione di autenticazione passata

      if (redirectSessionId) {
        // Se è presente una sessione a cui reindirizzare → naviga lì
        navigate(`/session/${redirectSessionId}`);
        setRedirectSessionId(null); // Pulisce il redirect
      } else {
        // Altrimenti naviga alla pagina personale utente
        navigate("/user");
      }

      onClose(); // Chiude il form/modal corrente
    } catch (err) {
      handleFirebaseError(err); // Gestisce l'errore
    } finally {
      setLoading(false); // Termina il caricamento
    }
  };

  /**
   * Gestisce gli errori restituiti da Firebase durante le operazioni di autenticazione
   * - Traduce i codici errore in messaggi utente più leggibili
   */
  const handleFirebaseError = (error) => {
    // Mappa dei codici di errore di Firebase → messaggi personalizzati in italiano
    const errorMessages = {
      'auth/invalid-email': "Email non valida. Controlla il formato.",
      'auth/user-disabled': "Account disabilitato. Contatta il supporto.",
      'auth/user-not-found': "Nessun account associato a questa email.",
      'auth/wrong-password': "Password errata. Riprova.",
      'auth/email-already-in-use': "Email già in uso da un altro account.",
      'auth/weak-password': "Password troppo debole. Deve contenere almeno 6 caratteri.",
      'auth/missing-password': "Inserisci una password.",
      'auth/missing-email': "Inserisci una email.",
      'auth/invalid-credential': "Credenziali non valide o scadute.",
      'auth/invalid-verification-code': "Codice di verifica non valido.",
      'auth/invalid-verification-id': "ID di verifica non valido.",
      'auth/popup-closed-by-user': "Hai chiuso la finestra di accesso.",
      'auth/cancelled-popup-request': "Un'altra finestra di accesso è già in corso.",
      'auth/popup-blocked': "Popup bloccato dal browser.",
      'auth/operation-not-allowed': "Tipo di autenticazione non abilitato per questo progetto.",
      'auth/account-exists-with-different-credential': "Esiste già un account con lo stesso indirizzo email ma con credenziali diverse.",
      'auth/credential-already-in-use': "Le credenziali sono già in uso da un altro utente.",
      'auth/timeout': "Timeout della richiesta. Riprova.",
      'auth/internal-error': "Errore interno. Riprova più tardi.",
      'auth/network-request-failed': "Errore di rete. Controlla la connessione.",
      'auth/too-many-requests': "Troppi tentativi falliti. Riprova più tardi.",
      'auth/requires-recent-login': "Per questa operazione è necessario un accesso recente. Effettua di nuovo il login.",
      'auth/unverified-email': "Email non verificata. Controlla la tua casella di posta.",
    };

    // Imposta il messaggio di errore corrispondente oppure un messaggio generico se il codice non è previsto
    setError(errorMessages[error.code] || `Errore imprevisto: ${error.message || error.code}`);
  };

  /**
   * Gestisce la registrazione di un nuovo utente
   * - Valida l'email (escludendo le whitelisted)
   * - Crea l'utente su Firebase
   * - Aggiorna il profilo utente con il nome
   * - Esegue il redirect dopo la registrazione
   */
  const handleRegister = async () => {
    setLoading(true);
    setError("");

    // Lista di email whitelisted che saltano il controllo di validità
    const whitelist = ["test@gmail.com", "test12"];

    try {
      // Se l'email non è nella whitelist → verifica con il servizio GhostMail
      if (!whitelist.includes(email)) {
        const check = await verifyEmailWithGhostMail(email);
        if (!check.valid) {
          // Se l'email non è valida o è temporanea → mostra errore e blocca la registrazione
          setError("Email non valida, temporanea o inesistente.");
          setLoading(false);
          return;
        }
      }

      // Crea un nuovo utente con email e password tramite Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Aggiorna il profilo dell'utente con il nome inserito
      await updateProfile(userCredential.user, { displayName: name });

      // Esegue il redirect alla sessione se prevista, altrimenti alla pagina utente
      if (redirectSessionId) {
        navigate(`/session/${redirectSessionId}`);
        setRedirectSessionId(null);
      } else {
        navigate("/user");
      }

      // Chiude il form/modal di registrazione
      onClose();
    } catch (err) {
      // Gestisce eventuali errori durante la registrazione
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full border border-purple-500 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-purple-400">
              {formType === "Login" ? "Accedi" : "Registrati"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Chiudi"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {formType === "Login" ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleAuthAction(() =>
                  signInWithEmailAndPassword(auth, email, password)
                );
              }}
            >
              <div>
                <label htmlFor="email" className="block text-purple-300 mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="tua@email.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-purple-300 mb-2">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="La tua password"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${loading
                  ? 'bg-purple-800 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/20'
                  }`}
              >
                {loading ? "Accesso in corso..." : "Accedi con Email"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-purple-300 mb-2">Nome completo</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Il tuo nome"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-purple-300 mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="tua@email.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-purple-300 mb-2">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Min. 6 caratteri"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${loading
                  ? 'bg-purple-800 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/20'
                  }`}
              >
                {loading ? "Registrazione in corso..." : "Registrati"}
              </button>
            </div>
          )}

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-600"></div>
            <span className="px-4 text-gray-400">oppure</span>
            <div className="flex-1 border-t border-gray-600"></div>
          </div>

          <button
            onClick={() => handleAuthAction(() => signInWithGoogle())}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            <img
              src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_48dp.png"
              alt="Google"
              className="h-5 w-5"
            />
            Continua con Google
          </button>
        </div>

        <div className="bg-gray-900/50 px-6 py-4 text-center">
          <p className="text-gray-400">
            {formType === "Login" ? "Non hai un account? " : "Hai già un account? "}
            <button
              onClick={() => {
                setError("");
                setFormType(formType === "Login" ? "Register" : "Login");
              }}
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              {formType === "Login" ? "Registrati" : "Accedi"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Popup;