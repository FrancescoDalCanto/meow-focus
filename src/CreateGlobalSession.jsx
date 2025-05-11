import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

function CreateGlobalSession() {
    // Stato per memorizzare il nome della sessione inserito dall'utente
    const [name, setName] = useState("");
    // Stato per memorizzare il numero di partecipanti inserito dall'utente (default: 1)
    const [participants, setParticipants] = useState(1);
    // Stato per mostrare un messaggio di successo dopo la creazione della sessione
    const [successMessage, setSuccessMessage] = useState("");
    // Stato per mostrare un eventuale messaggio di errore
    const [errorMessage, setErrorMessage] = useState("");

    /**
     * Funzione che gestisce la creazione di una nuova sessione
     * - Valida i campi (nome e numero partecipanti)
     * - Se valido → crea una nuova sessione su Firestore
     * - Mostra messaggi di errore o successo in base all'esito
     */
    const handleCreate = async () => {
        // Rimuove eventuali spazi dal nome della sessione
        const trimmedName = name.trim();

        // Converte il numero dei partecipanti in intero
        const parsedParticipants = parseInt(participants);

        // Verifica che il nome non sia vuoto dopo il trim
        if (!trimmedName) {
            setErrorMessage("Inserisci un nome valido per la sessione.");
            return; // Esce dalla funzione se il nome non è valido
        }

        // Verifica che il numero dei partecipanti sia almeno 1 e sia un numero valido
        if (isNaN(parsedParticipants) || parsedParticipants < 1) {
            setErrorMessage("Il numero di partecipanti deve essere almeno 1.");
            return; // Esce dalla funzione se il numero non è valido
        }

        // Durata predefinita della sessione di studio (25 minuti) in secondi
        const studyDuration = 25 * 60;

        // Durata predefinita della pausa (5 minuti) in secondi
        const breakDuration = 5 * 60;

        try {
            // Aggiunge un nuovo documento nella collezione "globalSessions" su Firestore
            await addDoc(collection(db, "globalSessions"), {
                name: trimmedName,                // Nome della sessione
                participants: parsedParticipants, // Numero di partecipanti
                studyDuration,                    // Durata della sessione di studio (in secondi)
                breakDuration,                    // Durata della pausa (in secondi)
                isActive: false,                  // La sessione non è ancora attiva
                isRunning: false,                 // Il timer non è in esecuzione
                isStudying: true,                 // Stato iniziale: modalità studio attiva
                isStudyTime: true,                // Indica che si parte dalla fase di studio
                startTime: Date.now(),            // Timestamp corrente (inizio sessione)
                remainingSeconds: studyDuration,  // Secondi rimanenti (uguale a studyDuration inizialmente)
                timeLeft: studyDuration,          // Alias di remainingSeconds (ridondanza utile)
                createdAt: serverTimestamp(),     // Timestamp generato dal server
                creatorId: "admin"                // ID fisso del creatore (admin)
            });

            // Mostra messaggio di successo
            setSuccessMessage(" Sessione creata con successo!");

            // Resetta il nome e il numero di partecipanti
            setName("");
            setParticipants(1);

            // Pulisce eventuali messaggi di errore precedenti
            setErrorMessage("");

            // Dopo 3 secondi, rimuove il messaggio di successo
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            // In caso di errore durante la creazione della sessione → mostra messaggio di errore
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