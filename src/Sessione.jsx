import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, getDoc } from "./firebase";
import generateSessionLink from "./Link";
import StudyBreakTimer from "./Timer";
import { useAuth } from "./AuthContext";

function Stanza({ sessionId: sessionIdProp = null }) {
    // Recupera l'utente attualmente autenticato
    const { currentUser } = useAuth();
    // Hook per la navigazione tra le pagine
    const navigate = useNavigate();
    // Recupera l'id della sessione dalla URL
    const { id: sessionIdFromUrl } = useParams();
    // Stato per la durata dello studio in minuti (default: 25 minuti)
    const [studyDuration, setStudyDuration] = useState(25);
    // Stato per la durata della pausa in minuti (default: 5 minuti)
    const [breakDuration, setBreakDuration] = useState(5);
    // Stato per l'id della sessione corrente
    // → Priorità: sessionIdProp (passato come prop) → sessionIdFromUrl (nella URL) → null
    const [sessionId, setSessionId] = useState(sessionIdProp || sessionIdFromUrl || null);
    // Stato per il link della sessione (URL condivisibile)
    const [sessionLink, setSessionLink] = useState("");
    // Stato per l'id dell'utente che ha creato la sessione
    const [sessionCreator, setSessionCreator] = useState(null);
    // Stato per memorizzare la lista dei partecipanti alla sessione
    const [participants, setParticipants] = useState([]);
    // Stato per controllare se il menu è aperto o chiuso
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // Stato per controllare se la musica LO-FI è attiva o meno
    const [isLoFiMusicOn, setIsLoFiMusicOn] = useState(false);
    // Stato per controllare se il popup di condivisione link è aperto
    const [isLinkPopupOpen, setIsLinkPopupOpen] = useState(false);
    // Stato per mostrare o nascondere il messaggio di copia link 
    const [showToast, setShowToast] = useState(false);
    // Calcola se l'utente corrente è il creatore della sessione
    // → Si aggiorna ogni volta che currentUser o sessionCreator cambiano
    const isCreator = React.useMemo(() => sessionCreator === currentUser?.uid, [sessionCreator, currentUser]);

    /**
     * useEffect → crea una nuova sessione se non esiste già e l'utente è autenticato
     */
    useEffect(() => {
        if (!sessionId && currentUser) {
            createSession();
        }
    }, [sessionId, currentUser]);

    /**
     * Crea una nuova sessione e aggiorna gli stati correlati (id, link, creator)
     */
    const createSession = async () => {
        try {
            // Genera il link della sessione con le informazioni di durata e creatore
            const link = await generateSessionLink({
                studyDuration: studyDuration * 60,   // Converte i minuti in secondi
                breakDuration: breakDuration * 60,
                creatorId: currentUser?.uid,
            });

            // Estrae l'id della sessione dal link generato
            const id = link.split("/session/")[1];

            // Imposta gli stati con le informazioni della nuova sessione
            setSessionId(id);
            setSessionLink(link);
            setSessionCreator(currentUser?.uid);
        } catch (err) {
            console.error("Errore creazione sessione:", err);
            alert("Errore durante la creazione della stanza.");
        }
    };

    /**
     * useEffect → ascolta i cambiamenti del documento della sessione su Firestore
     * → Aggiorna localmente dati come durate, creatore e partecipanti
     */
    useEffect(() => {
        if (!sessionId) return;

        const ref = doc(db, "globalSessions", sessionId);

        // Si sottoscrive ai cambiamenti del documento in Firestore
        const unsub = onSnapshot(ref, (snap) => {
            const data = snap.data();
            if (data) {
                setStudyDuration(data.studyDuration / 60); // Aggiorna durata studio (da secondi a minuti)
                setBreakDuration(data.breakDuration / 60); // Aggiorna durata pausa (da secondi a minuti)

                // Aggiorna il creatore se non impostato o diverso
                if (!sessionCreator || sessionCreator !== data.creatorId) {
                    setSessionCreator(data.creatorId);
                }

                // Aggiorna la lista dei partecipanti
                setParticipants(data.participants || []);
            }
        });

        // Cleanup: rimuove la sottoscrizione quando il componente si smonta o sessionId cambia
        return () => unsub();
    }, [sessionId, sessionCreator]);

    /**
     * useEffect → genera il link della sessione ogni volta che sessionId cambia
     */
    useEffect(() => {
        if (sessionId) {
            setSessionLink(`${window.location.origin}/session/${sessionId}`);
        }
    }, [sessionId]);

    /**
     * Copia il link della sessione negli appunti e mostra un toast di conferma
     */
    const handleCopyLink = () => {
        navigator.clipboard.writeText(sessionLink);
        setShowToast(true);          // Mostra il toast
        setIsLinkPopupOpen(false);   // Chiude il popup link
        setTimeout(() => setShowToast(false), 2500); // Nasconde il toast dopo 2.5 secondi
    };

    /**
     * Attiva o disattiva la musica LO-FI
     */
    const toggleLoFiMusic = () => setIsLoFiMusicOn((prev) => !prev);

    /**
     * Gestisce la modifica delle durate di studio o pausa
     * - Limita il valore massimo
     * - Se la sessione è sincronizzata e l'utente è il creatore → aggiorna Firestore
     */
    const handleDurationChange = (setter, fieldName, maxValue) => async (e) => {
        let value = e.target.value;

        // Permette l'inserimento di un campo vuoto (es. durante la digitazione)
        if (value === "") {
            setter("");
            return;
        }

        let parsed = parseInt(value);

        // Se il valore non è un numero → esce
        if (isNaN(parsed)) return;

        // Limita il valore massimo
        if (parsed > maxValue) {
            parsed = maxValue;
        }

        // Aggiorna lo stato locale
        setter(parsed);

        // Se la sessione è sincronizzata e l'utente è il creatore → aggiorna Firestore
        if (sessionId && isCreator) {
            const ref = doc(db, "globalSessions", sessionId);
            const snap = await getDoc(ref);
            if (!snap.exists()) return;

            const data = snap.data();
            const updates = { [fieldName]: parsed * 60 }; // Converte in secondi

            // Se il timer non è in esecuzione → aggiorna anche remainingSeconds e startTime
            if (!data.isRunning) {
                const isChangingStudy = fieldName === "studyDuration";

                if (isChangingStudy && data.isStudyTime) {
                    updates.remainingSeconds = parsed * 60;
                } else if (!isChangingStudy && !data.isStudyTime) {
                    updates.remainingSeconds = parsed * 60;
                }

                updates.startTime = Date.now();
                updates.isRunning = false;
            }

            // Esegue l'aggiornamento su Firestore
            await updateDoc(ref, updates);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 relative">
            <header className="grid grid-cols-3 items-center mb-8 md:mb-12">
                <div className="flex items-center gap-4 justify-start">
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-3 rounded-lg transition-colors ${isMenuOpen ? "bg-purple-700" : "bg-purple-800 hover:bg-purple-700"}`}
                            aria-label="Menu"
                        >
                            <div className="space-y-1.5 w-6">
                                <span className={`block h-0.5 bg-white transition-all ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
                                <span className={`block h-0.5 bg-white ${isMenuOpen ? "opacity-0" : ""}`} />
                                <span className={`block h-0.5 bg-white transition-all ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
                            </div>
                        </button>

                        {isMenuOpen && (
                            <div className="absolute left-0 mt-2 w-48 bg-purple-800 rounded-lg shadow-xl z-50 overflow-hidden">
                                <ul>
                                    <li>
                                        <button
                                            onClick={() => setIsLinkPopupOpen(true)}
                                            className="w-full text-left px-4 py-3 hover:bg-purple-700 transition-colors"
                                        >
                                            🔗 Link
                                        </button>
                                    </li>
                                    <li className="flex items-center justify-between px-4 py-3 hover:bg-purple-700 transition-colors">
                                        <span className="text-white">Musica LoFi</span>
                                        <button
                                            onClick={toggleLoFiMusic}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isLoFiMusicOn ? "bg-green-600" : "bg-gray-300"
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isLoFiMusicOn ? "translate-x-6" : "translate-x-1"
                                                    }`}
                                            />
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <h1 className="text-2xl md:text-4xl font-bold text-purple-400 text-center">MeowFocus</h1>

                <div className="flex justify-end">
                    <button
                        onClick={() => navigate("/user")}
                        className="bg-purple-700 hover:bg-purple-600 px-4 py-2 md:px-6 md:py-3 rounded-lg transition-colors"
                    >
                        ← Exit
                    </button>
                </div>
            </header>

            <h2 className="text-3xl md:text-5xl font-bold text-purple-300 text-center mb-4">
                È ora di studiare!
            </h2>

            {/* 
<p className="text-center text-purple-400 mb-8 text-lg">
  👥 Partecipanti connessi: {participants && participants.length > 0 ? participants.length + 1 : 1}
</p> 
*/}

            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl mb-12 max-w-3xl mx-auto">
                <StudyBreakTimer
                    studyDuration={studyDuration * 60}
                    breakDuration={breakDuration * 60}
                    sessionId={sessionId}
                    sync={!!sessionId}
                    canControl={isCreator}
                />
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
                <div className="bg-gray-800 p-6 rounded-xl">
                    <label className="block text-purple-300 text-lg mb-2">Durata studio (minuti)</label>
                    <input
                        type="number"
                        value={studyDuration}
                        onChange={handleDurationChange(setStudyDuration, "studyDuration", 1440)}
                        className="w-full bg-gray-700 text-white p-3 rounded-lg text-center text-xl focus:outline-none focus:ring-2 focus:ring-purple-500 no-spinner"
                        readOnly={!isCreator}
                    />
                </div>

                <div className="bg-gray-800 p-6 rounded-xl">
                    <label className="block text-purple-300 text-lg mb-2">Durata pausa (minuti)</label>
                    <input
                        type="number"
                        value={breakDuration}
                        onChange={handleDurationChange(setBreakDuration, "breakDuration", 30)}
                        className="w-full bg-gray-700 text-white p-3 rounded-lg text-center text-xl focus:outline-none focus:ring-2 focus:ring-purple-500 no-spinner"
                        readOnly={!isCreator}
                    />
                </div>
            </section>

            {isLinkPopupOpen && sessionLink && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 w-96 border border-purple-500">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-purple-300">Condividi stanza</h3>
                            <button
                                onClick={() => setIsLinkPopupOpen(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="mb-6">
                            <div className="flex">
                                <input
                                    type="text"
                                    value={sessionLink}
                                    className="flex-1 bg-gray-700 text-white p-3 rounded-l-lg truncate"
                                    readOnly
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className="bg-purple-600 hover:bg-purple-500 px-4 rounded-r-lg"
                                >
                                    📋
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showToast && (
                <div className="fixed bottom-6 right-6 bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                    Link copiato!
                </div>
            )}

            {isLoFiMusicOn && (
                <iframe width="0" height="0" style={{ display: "none" }} src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}`} title="LoFi Music" allow="autoplay" />

            )}
        </div>
    );
}

export default Stanza;
