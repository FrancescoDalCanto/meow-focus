import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, getDoc } from "./firebase";
import generateSessionLink from "./Link";
import StudyBreakTimer from "./Timer";
import { useAuth } from "./AuthContext";

function Stanza({ sessionId: sessionIdProp = null }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { id: sessionIdFromUrl } = useParams();

    const [studyDuration, setStudyDuration] = useState(25);
    const [breakDuration, setBreakDuration] = useState(5);
    const [sessionId, setSessionId] = useState(sessionIdProp || sessionIdFromUrl || null);
    const [sessionLink, setSessionLink] = useState("");
    const [sessionCreator, setSessionCreator] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoFiMusicOn, setIsLoFiMusicOn] = useState(false);
    const [isLinkPopupOpen, setIsLinkPopupOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);


    //si aggiorna ogni volta che currentUser o sessionCreator cambiano
    const isCreator = React.useMemo(() => sessionCreator === currentUser?.uid, [sessionCreator, currentUser]);

    useEffect(() => {
        if (!sessionId && currentUser) {
            createSession();
        }
    }, [sessionId, currentUser]);

    const createSession = async () => {
        try {
            const link = await generateSessionLink({
                studyDuration: studyDuration * 60,
                breakDuration: breakDuration * 60,
                creatorId: currentUser?.uid,
            });
            const id = link.split("/session/")[1];
            setSessionId(id);
            setSessionLink(link);
            setSessionCreator(currentUser?.uid);
        } catch (err) {
            console.error("Errore creazione sessione:", err);
            alert("Errore durante la creazione della stanza.");
        }
    };

    useEffect(() => {
        if (!sessionId) return;
        const ref = doc(db, "globalSessions", sessionId);
        const unsub = onSnapshot(ref, (snap) => {
            const data = snap.data();
            if (data) {
                setStudyDuration(data.studyDuration / 60);
                setBreakDuration(data.breakDuration / 60);
                if (!sessionCreator || sessionCreator !== data.creatorId) {
                    setSessionCreator(data.creatorId);
                }
                setParticipants(data.participants || []);
            }
        });
        return () => unsub();
    }, [sessionId, sessionCreator]);

    useEffect(() => {
        if (sessionId) {
            setSessionLink(`${window.location.origin}/session/${sessionId}`);
        }
    }, [sessionId]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(sessionLink);
        setShowToast(true);
        setIsLinkPopupOpen(false);
        setTimeout(() => setShowToast(false), 2500);
    };

    const toggleLoFiMusic = () => setIsLoFiMusicOn((prev) => !prev);

    const handleDurationChange = (setter, fieldName, maxValue) => async (e) => {
        let value = e.target.value;
        if (value === "") {
            setter("");
            return;
        }

        let parsed = parseInt(value);
        if (isNaN(parsed)) return;

        if (parsed > maxValue) {
            parsed = maxValue;
        }

        setter(parsed);

        if (sessionId && isCreator) {
            const ref = doc(db, "globalSessions", sessionId);
            const snap = await getDoc(ref);
            if (!snap.exists()) return;

            const data = snap.data();
            const updates = { [fieldName]: parsed * 60 };

            // Sempre aggiorniamo remainingSeconds e startTime, se il timer è fermo
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
                    <p className="text-sm text-purple-400 mt-2 text-center">Max: 1440 minuti</p>
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
                    <p className="text-sm text-purple-400 mt-2 text-center">Max: 30 minuti</p>
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
                <iframe
                    width="0"
                    height="0"
                    style={{ display: "none" }}
                    src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=0&loop=1&playlist=jfKfPfyJRdk"
                    title="LoFi Music"
                    allow="autoplay"
                />
            )}
        </div>
    );
}

export default Stanza;
