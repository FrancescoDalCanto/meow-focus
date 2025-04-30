import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

function CreateGlobalSession() {
    const [name, setName] = useState("");
    const [participants, setParticipants] = useState(1);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleCreate = async () => {
        const trimmedName = name.trim();
        const parsedParticipants = parseInt(participants);

        if (!trimmedName) {
            setErrorMessage("Inserisci un nome valido per la sessione.");
            return;
        }

        if (isNaN(parsedParticipants) || parsedParticipants < 1) {
            setErrorMessage("Il numero di partecipanti deve essere almeno 1.");
            return;
        }

        const studyDuration = 25 * 60; // 25 minuti
        const breakDuration = 5 * 60;  // 5 minuti

        try {
            await addDoc(collection(db, "globalSessions"), {
                name: trimmedName,
                participants: parsedParticipants,
                studyDuration,
                breakDuration,
                isActive: false,
                isRunning: false,
                isStudying: true,
                isStudyTime: true,
                startTime: Date.now(),
                remainingSeconds: studyDuration,
                timeLeft: studyDuration,
                createdAt: serverTimestamp(),
                creatorId: "admin"
            });

            setSuccessMessage("✅ Sessione creata con successo!");
            setName("");
            setParticipants(1);
            setErrorMessage("");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            console.error("Errore durante la creazione:", error);
            setErrorMessage("Errore durante la creazione. Riprova.");
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl max-w-md mx-auto shadow-lg mt-12">
            <h2 className="text-xl font-bold text-purple-300 mb-4">Crea Sessione Globale</h2>

            <label className="block text-purple-200 mb-2">Nome sessione</label>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-700 text-white p-3 rounded-lg mb-4"
                placeholder="Esempio: Sessione Matematica"
            />

            <label className="block text-purple-200 mb-2">Partecipanti iniziali</label>
            <input
                type="number"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                className="w-full bg-gray-700 text-white p-3 rounded-lg mb-4"
                min={1}
                max={999}
            />

            {errorMessage && <p className="text-red-400 mb-4">{errorMessage}</p>}
            {successMessage && <p className="text-green-400 mb-4">{successMessage}</p>}

            <button
                onClick={handleCreate}
                className="w-full bg-purple-600 hover:bg-purple-500 px-4 py-3 rounded-lg text-white font-semibold transition-all"
            >
                Crea Sessione
            </button>
        </div>
    );
}

export default CreateGlobalSession;