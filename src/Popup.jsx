import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyEmailWithGhostMail } from "./GhostMail";


import {
  auth,
  signInWithEmailAndPassword,
  signInWithGoogle,
  createUserWithEmailAndPassword,
  updateProfile
} from "./firebase.jsx";
import { useRedirect } from "./RedirectContext";

const Popup = ({ type, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formType, setFormType] = useState(type);
  const navigate = useNavigate();
  const { redirectSessionId, setRedirectSessionId } = useRedirect();

  const handleAuthAction = async (authFunction) => {
    setLoading(true);
    setError("");
    try {
      await authFunction();
      if (redirectSessionId) {
        navigate(`/session/${redirectSessionId}`);
        setRedirectSessionId(null);
      } else {
        navigate("/user");
      }
      onClose();
    } catch (err) {
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseError = (error) => {
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

    setError(errorMessages[error.code] || `Errore imprevisto: ${error.message || error.code}`);
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    const whitelist = ["test@gmail.com", "test12"];

    try {
      if (!whitelist.includes(email)) {
        const check = await verifyEmailWithGhostMail(email);
        if (!check.valid) {
          setError("Email non valida, temporanea o inesistente.");
          setLoading(false);
          return;
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });

      if (redirectSessionId) {
        navigate(`/session/${redirectSessionId}`);
        setRedirectSessionId(null);
      } else {
        navigate("/user");
      }

      onClose();
    } catch (err) {
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

          <div className="space-y-4">
            {formType === "Register" && (
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
            )}

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
                placeholder={formType === "Login" ? "La tua password" : "Min. 6 caratteri"}
                disabled={loading}
              />
            </div>

            <button
              onClick={() =>
                formType === "Login"
                  ? handleAuthAction(() => signInWithEmailAndPassword(auth, email, password))
                  : handleRegister()
              }
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${loading
                ? 'bg-purple-800 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/20'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {formType === "Login" ? "Accesso in corso..." : "Registrazione in corso..."}
                </span>
              ) : (
                formType === "Login" ? "Accedi con Email" : "Registrati"
              )}
            </button>
          </div>

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