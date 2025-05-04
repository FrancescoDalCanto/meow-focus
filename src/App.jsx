import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import Popup from "./Popup";
import ActiveSessions from "./ActiveSessions";
import { useRedirect } from "./RedirectContext";
import "./App.css";

function App() {
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);

  const { currentUser } = useAuth();
  const { setRedirectSessionId } = useRedirect();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessionsFromDB = async () => {
      try {
        const q = query(collection(db, "globalSessions"), where("isActive", "==", true));
        const querySnapshot = await getDocs(q);
        const sessions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActiveSessions(sessions);
      } catch (error) {
        console.error("Errore nel recupero delle sessioni:", error);
      }
    };

    fetchSessionsFromDB();
  }, []);

  const handleSessionClickOrLogin = (sessionId) => {
    if (!sessionId) return;
    if (currentUser) {
      navigate(`/session/${sessionId}`);
    } else {
      setRedirectSessionId(sessionId);
      setPopupType("Login");
      setShowPopup(true);
    }
  };

  const openPopup = (type) => {
    setPopupType(type);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const toggleEasterEgg = () => {
    setShowEasterEgg(!showEasterEgg);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 relative overflow-hidden">
      {/* Easter Egg */}
      <div
        className={`fixed right-8 bottom-8 transition-all duration-500 transform ${showEasterEgg ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
        onMouseLeave={toggleEasterEgg}
        onClick={toggleEasterEgg}
      >
        <div className="bg-purple-700 p-4 rounded-lg shadow-xl">
          <img
            src="/gattino_segretino.png"
            alt="Easter Egg Cat"
            className="w-16 h-16 animate-bounce"
          />
          <p className="text-xs mt-2">Psst! Hai trovato il gattino segreto!</p>
        </div>
      </div>

      {/* Area trigger easter egg */}
      <div
        className="fixed right-0 top-1/2 h-32 w-8 -translate-y-1/2 cursor-pointer"
        onMouseEnter={toggleEasterEgg}
      ></div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-12">
        {/* Colonna sinistra */}
        <div className="flex flex-col items-center lg:items-end justify-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 text-center lg:text-right">
            MeowFocus
          </h1>
          <img
            src="/Pomostudy.png"
            alt="MeowFocus"
            className="w-full max-w-md lg:max-w-lg h-auto transform hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Colonna destra */}
        <div className="flex flex-col items-center lg:items-start justify-center space-y-8 h-full">
          <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg flex flex-col" style={{ height: '400px' }}>
            <div className="p-6 pb-0">
              <h2 className="text-2xl font-bold text-purple-300 mb-4">Sessioni Attive</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <ActiveSessions
                sessions={activeSessions}
                openLoginPopup={handleSessionClickOrLogin}
              />
            </div>
          </div>

          {/* Pulsanti Login/Register */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              aria-label="Login Button"
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white text-lg px-6 py-4 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
              onClick={() => openPopup("Login")}
            >
              Login
            </button>
            <button
              aria-label="Register Button"
              className="flex-1 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white text-lg px-6 py-4 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
              onClick={() => openPopup("Register")}
            >
              Register
            </button>
          </div>
        </div>
      </div>

      {showPopup && <Popup type={popupType} onClose={closePopup} />}

      {/* Footer Instagram link */}
      <div className="fixed bottom-4 left-4 text-gray-400 text-sm hover:text-white transition-colors duration-300">
        Creato da:{" "}
        <a
          href="https://www.instagram.com/francesco.dalcanto"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          @francesco.dalcanto
        </a>
      </div>
    </div>
  );
}

export default App;