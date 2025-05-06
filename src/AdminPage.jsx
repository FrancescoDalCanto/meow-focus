import React, { useState, useEffect } from "react";
import { doc, setDoc, deleteDoc, collection, onSnapshot, getDocs, updateDoc, query, orderBy, collectionGroup } from "firebase/firestore";
import { db } from "./firebase";
import CreateGlobalSession from "./CreateGlobalSession";

function AdminPage() {
    const [autenticato, setAutenticato] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errore, setErrore] = useState("");
    const [globalSessions, setGlobalSessions] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email === "admin@gmail.com" && password === "admin123") {
            setAutenticato(true);
        } else {
            setErrore("Credenziali non valide.");
        }
    };

    useEffect(() => {
        if (!autenticato) return;

        const q = collection(db, "globalSessions");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessions = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));
            setGlobalSessions(sessions.filter(session => session.creatorId === "admin"));
        });

        return () => unsubscribe();
    }, [autenticato]);

    const caricaSuggerimenti = async () => {
        setLoadingSuggestions(true);
        const suggestionsData = [];

        const snapshot = await getDocs(collectionGroup(db, "suggestions"));

        snapshot.forEach((docSnap) => {
            const pathSegments = docSnap.ref.path.split("/");
            const userId = pathSegments[1];
            const data = docSnap.data();

            if (!data.text) return;

            suggestionsData.push({
                id: docSnap.id,
                userId,
                text: data.text,
                createdAt: data.createdAt || null,
            });
        });

        setSuggestions(suggestionsData);
        setShowSuggestions(true);
        setLoadingSuggestions(false);
    };

    const creaSessione = async (session) => {
        try {
            const studySeconds = 50 * 60;
            const breakSeconds = 10 * 60;
            const now = Date.now();

            const sessionData = {
                id: session.id,
                name: session.name,
                isActive: true,
                createdAt: new Date(),
                participants: [],
                creatorId: "admin",
                studyDuration: studySeconds,
                breakDuration: breakSeconds,
                isStudyTime: true,
                isRunning: true,
                isPaused: false,
                startTime: now,
                remainingSeconds: studySeconds,
            };

            await setDoc(doc(db, "globalSessions", session.id), sessionData);
        } catch (error) {
            console.error("Errore nella creazione della sessione:", error);
            alert("Errore: " + error.message);
        }
    };

    const creaTutteLeSessioni = async () => {
        for (const session of globalSessions) {
            await creaSessione(session);
        }
    };

    const avviaSoloNonAttive = async () => {
        const nonAttive = globalSessions.filter(session => !session.isActive);
        for (const session of nonAttive) {
            await creaSessione(session);
        }
        alert(`${nonAttive.length} sessioni attivate.`);
    };

    const eliminaSessioneGlobal = async (sessionId) => {
        const conferma = window.confirm(`Vuoi eliminare "${sessionId}" da globalSessions e, se attiva, anche da sessions?`);
        if (!conferma) return;

        try {
            await deleteDoc(doc(db, "globalSessions", sessionId));
            await deleteDoc(doc(db, "sessions", sessionId));
        } catch (error) {
            console.error("Errore durante l'eliminazione:", error);
            alert("Errore durante l'eliminazione. Guarda la console.");
        }
    };

    const correggiSessioniGlobali = async () => {
        const snapshot = await getDocs(collection(db, "globalSessions"));
        const promises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            if (data.isStudying !== undefined) {
                await updateDoc(doc(db, "globalSessions", docSnap.id), {
                    isStudyTime: data.isStudying,
                    isStudying: null,
                });
                console.log(`Corretto ${docSnap.id}`);
            }
        });
        await Promise.all(promises);
        alert("Tutte le sessioni sono state corrette!");
    };

    const avviaSessioneManuale = async (sessionId) => {
        const conferma = window.confirm("Sei sicuro di voler avviare questa sessione?");
        if (!conferma) return;

        try {
            const sessionRef = doc(db, "globalSessions", sessionId);
            await updateDoc(sessionRef, {
                isRunning: true,
                isPaused: false,
                startTime: Date.now(),
            });
            alert("Sessione avviata manualmente!");
        } catch (error) {
            console.error("Errore nell'avvio manuale:", error);
            alert("Errore durante l'avvio manuale. Guarda la console.");
        }
    };

    if (!autenticato) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm">
                    <h2 className="text-xl font-bold mb-4 text-purple-400">Accesso Admin</h2>
                    <div className="mb-4">
                        <label className="block mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white" required />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white" required />
                    </div>
                    {errore && <p className="text-red-500 mb-4">{errore}</p>}
                    <button type="submit" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-bold w-full">Accedi</button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold text-purple-400 mb-8">Pannello Admin</h1>

            <div className="mb-6 space-y-4">
                <button onClick={creaTutteLeSessioni} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-white font-semibold w-full">🚀 Avvia tutte le sessioni predefinite</button>
                <button onClick={avviaSoloNonAttive} className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded text-white font-semibold w-full">⚙️ Avvia solo le sessioni non attive</button>
                <button onClick={correggiSessioniGlobali} className="bg-pink-600 hover:bg-pink-700 px-6 py-3 rounded text-white font-semibold w-full">🛠 Correggi tutte le sessioni</button>
                <button onClick={caricaSuggerimenti} className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded text-white font-semibold w-full">📋 Visualizza suggerimenti</button>
                {loadingSuggestions && (
                    <p className="text-gray-400 text-sm mt-2">Caricamento suggerimenti...</p>
                )}
            </div>

            <CreateGlobalSession />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 mt-8">
                {globalSessions.map((session) => (
                    <div key={session.id} className="bg-gray-800 p-4 rounded-lg shadow">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-semibold text-purple-300">{session.name}</h2>
                            <span className={`h-3 w-3 rounded-full inline-block ${session.isActive ? "bg-green-400" : "bg-red-400"}`} title={session.isActive ? "Attiva" : "Non attiva"} />
                        </div>
                        <p className="text-sm text-gray-400 mb-4">Studio: 50 min • Pausa: 10 min</p>
                        <button onClick={() => creaSessione(session)} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-bold w-full">▶️ Avvia singola sessione</button>
                        <button onClick={() => eliminaSessioneGlobal(session.id)} className="bg-red-600 hover:bg-red-700 mt-2 px-4 py-2 rounded text-white font-bold w-full">🗑 Elimina sessione</button>
                        {!session.isRunning && (
                            <button onClick={() => avviaSessioneManuale(session.id)} className="bg-blue-600 hover:bg-blue-700 mt-2 px-4 py-2 rounded text-white font-bold w-full">▶️ Avvia manualmente</button>
                        )}
                        <p className="text-green-400 mt-3 break-all text-sm">Link: <a href={`/session/${session.id}`} className="underline">{window.location.origin}/session/{session.id}</a></p>
                    </div>
                ))}
            </div>

            {showSuggestions && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-purple-300">📋 Tutti i suggerimenti ricevuti</h2>
                        <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-white text-xl">&times;</button>
                    </div>

                    {suggestions.length === 0 ? (
                        <p className="text-gray-400">Nessun suggerimento trovato.</p>
                    ) : (
                        <ul className="space-y-4">
                            {suggestions.map((sug) => (
                                <li key={sug.id} className="bg-gray-700 p-4 rounded-lg">
                                    <p className="text-purple-300 mb-2">👤 <strong>Utente:</strong> {sug.userId}</p>
                                    <p className="mb-2">📝 <strong>Testo:</strong> {sug.text}</p>
                                    <p className="text-gray-400 text-sm">🕒 {sug.createdAt?.toDate?.().toLocaleString() ?? "Data non disponibile"}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

export default AdminPage;