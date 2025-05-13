import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "./firebase.jsx";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import StudyBreakTimer from "./Timer";
import JoinSession from "./JoinSession";
import useLoFiMusic from "./useLoFiMusic";
import StudyProgress from "./StudyProgress";

function User() {
  // Ottiene l'utente attualmente autenticato dal contesto Auth
  const { currentUser } = useAuth();
  // Hook di React Router per navigare tra le pagine
  const navigate = useNavigate();
  // Stato per la durata della sessione di studio (in minuti), default: 25 minuti
  const [studyDuration, setStudyDuration] = useState(25);
  // Stato per la durata della pausa (in minuti), default: 5 minuti
  const [breakDuration, setBreakDuration] = useState(5);
  // Stato per controllare se il popup "Unisciti a una sessione" è aperto
  const [isJoinSessionOpen, setIsJoinSessionOpen] = useState(false);
  // Stato per controllare se il menu laterale (hamburger) è aperto
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Stato per controllare se il pannello di progresso dello studio è aperto
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  // Stato per controllare se il popup di conferma logout è aperto
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  // Stato per controllare se il popup di suggerimenti e miglioramenti è aperto
  const [isImprovementsOpen, setIsImprovementsOpen] = useState(false);
  // Stato per il testo scritto dall’utente nel popup dei suggerimenti
  const [improvementText, setImprovementText] = useState("");
  // Hook personalizzato per gestire la musica LoFi (on/off)
  const { isLoFiMusicOn, toggleLoFiMusic } = useLoFiMusic();

  // ID del video YouTube della musica LoFi da riprodurre
  const videoId = "jfKfPfyJRdk";

  /**
   * Restituisce il nome da visualizzare per l'utente corrente.
   * Se non presente, usa la parte prima della @ dell'email.
   */
  const getUserDisplayName = () => {
    if (!currentUser) return "";
    return currentUser.displayName || (currentUser.email ? currentUser.email.split("@")[0] : "Utente");
  };

  /**
   * Effettua il logout dell'utente e reindirizza alla homepage.
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      alert("Errore durante il logout. Riprova più tardi.");
      console.error("Errore logout:", error);
    }
  };

  /**
   * Cambia la durata (studio o pausa), limitando il valore in un range.
   */
  const handleDurationChange = (setter, min, max) => (e) => {
    const value = e.target.value;

    if (value === "") {
      setter("");
      return;
    }

    const parsedValue = parseInt(value);
    if (!isNaN(parsedValue)) {
      const clamped = Math.min(Math.max(parsedValue, min), max);
      setter(clamped);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 relative">
      {/* Header con menu, saluto e pulsante logout */}
      <header className="grid grid-cols-3 items-center mb-8 md:mb-12">
        <div className="flex items-center gap-4 justify-start">
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-3 rounded-lg transition-colors ${isMenuOpen ? "bg-purple-700" : "bg-purple-800 hover:bg-purple-700"}`}
              aria-label="Menu"
            >
              <div className="space-y-1.5 w-6">
                <span className={`block h-0.5 bg-white transition-all ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
                <span className={`block h-0.5 bg-white ${isMenuOpen ? "opacity-0" : ""}`}></span>
                <span className={`block h-0.5 bg-white transition-all ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
              </div>
            </button>

            {/* Menu laterale */}
            {isMenuOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-purple-800 rounded-lg shadow-xl z-50 overflow-hidden">
                <ul>
                  <li>
                    <button onClick={() => navigate("/sessions")} className="w-full text-left px-4 py-3 hover:bg-purple-700 transition-colors">🐱 Nuova sessione</button>
                  </li>
                  <li>
                    <button onClick={() => { setIsJoinSessionOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-purple-700 transition-colors">🚪 Join</button>
                  </li>
                  <li>
                    <button onClick={() => { setIsProgressOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-purple-700 transition-colors">📊 Andamento studio</button>
                  </li>
                  <li>
                    <button onClick={() => { setIsImprovementsOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-purple-700 transition-colors">📝 Miglioramenti</button>
                  </li>
                  <li className="flex items-center justify-between px-4 py-3 hover:bg-purple-700 transition-colors">
                    <span className="text-white">Musica LoFi</span>
                    <button onClick={toggleLoFiMusic} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isLoFiMusicOn ? "bg-green-600" : "bg-gray-300"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isLoFiMusicOn ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {currentUser && (
            <div className="hidden md:block bg-gray-800 px-4 py-2 rounded-lg">
              <p className="text-purple-300">Ciao, {getUserDisplayName()}!</p>
            </div>
          )}
        </div>

        <h1 className="text-2xl md:text-4xl font-bold text-purple-400 text-center">MeowFocus</h1>

        <div className="flex justify-end">
          <button onClick={() => setIsLogoutConfirmOpen(true)} className="bg-purple-700 hover:bg-purple-600 px-4 py-2 md:px-6 md:py-3 rounded-lg transition-colors">Logout</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <section className="mb-12 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-purple-300 mb-6">È ora di studiare!</h2>

          <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex justify-center items-center min-h-[200px]">
            <StudyBreakTimer studyDuration={studyDuration * 60} breakDuration={breakDuration * 60} sync={false} canControl={true} />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800 p-6 rounded-xl">
            <label className="block text-purple-300 text-lg mb-2">Durata studio (minuti)</label>
            <input type="number" value={studyDuration} onChange={handleDurationChange(setStudyDuration, 1, 1440)} className="w-full bg-gray-700 text-white p-3 rounded-lg text-center text-xl focus:outline-none focus:ring-2 focus:ring-purple-500 no-spinner" />
          </div>

          <div className="bg-gray-800 p-6 rounded-xl">
            <label className="block text-purple-300 text-lg mb-2">Durata pausa (minuti)</label>
            <input type="number" value={breakDuration} onChange={handleDurationChange(setBreakDuration, 1, 30)} className="w-full bg-gray-700 text-white p-3 rounded-lg text-center text-xl focus:outline-none focus:ring-2 focus:ring-purple-500 no-spinner" />
          </div>
        </section>
      </main>

      {/* Modale andamento studio */}
      {isProgressOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-3xl w-full p-6 border border-purple-500 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-purple-300">📊 Andamento studio</h3>
              <button onClick={() => setIsProgressOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <StudyProgress />
          </div>
        </div>
      )}

      {/* Modale miglioramenti */}
      {isImprovementsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-purple-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-purple-300">📝 Miglioramenti</h3>
              <button onClick={() => setIsImprovementsOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <textarea value={improvementText} onChange={(e) => setImprovementText(e.target.value)} placeholder="Scrivi qui i tuoi suggerimenti..." className="w-full h-40 p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-4" />

            <button onClick={async () => {
              if (improvementText.trim() === "") {
                alert("Per favore, scrivi qualcosa prima di inviare.");
                return;
              }

              try {
                await addDoc(collection(db, "suggestions", currentUser.uid, "suggestions"), {
                  text: improvementText,
                  createdAt: serverTimestamp(),
                });
                alert("Grazie! Il tuo suggerimento è stato inviato.");
                setImprovementText("");
                setIsImprovementsOpen(false);
              } catch (error) {
                console.error("Errore invio suggerimento:", error);
                alert("Errore durante l'invio. Riprova più tardi.");
              }
            }} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg w-full transition-colors">Invia suggerimento</button>
          </div>
        </div>
      )}

      {/* Modale join session */}
      {isJoinSessionOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-purple-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-purple-300">🚪 Unisciti a una sessione</h3>
              <button onClick={() => setIsJoinSessionOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <JoinSession onClose={() => setIsJoinSessionOpen(false)} />
          </div>
        </div>
      )}

      {/* Modale conferma logout */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-sm w-full p-6 border border-purple-500">
            <div className="flex justify-center gap-3 mb-4">
              <span className="text-3xl text-purple-500">⚠️</span>
              <h2 className="text-lg font-bold text-white">Sei sicuro di voler uscire?</h2>
            </div>
            <div className="flex justify-center gap-4">
              <button onClick={() => setIsLogoutConfirmOpen(false)} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg">Annulla</button>
              <button onClick={handleLogout} className="bg-purple-500 hover:bg-purple-400 px-4 py-2 rounded-lg">Esci</button>
            </div>
          </div>
        </div>
      )}

      {/* Musica LoFi in background (nascosta) */}
      {isLoFiMusicOn && (
        <iframe width="0" height="0" style={{ display: "none" }} src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}`} title="LoFi Music" allow="autoplay" />
      )}
    </div>
  );
}

export default User;