import { db } from './firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from './firebase';

export default async function generateSessionLink({ studyDuration, breakDuration }) {
    // Genera un ID univoco per la sessione
    // - Usa Math.random() per creare una stringa casuale in base 36 e ne prende una sottostringa
    const sessionId = Math.random().toString(36).substring(2, 10);

    // Ottiene l'utente attualmente autenticato da Firebase Authentication
    const currentUser = auth.currentUser;

    // Crea il link della sessione utilizzando l'ID generato
    const link = `http://localhost:5173/session/${sessionId}`;

    try {
        // Salva la nuova sessione nel database Firestore, nella collezione "globalSessions"
        await setDoc(doc(collection(db, 'globalSessions'), sessionId), {
            createdAt: serverTimestamp(),   // Timestamp di creazione generato dal server
            studyDuration,                  // Durata dello studio (in secondi)
            breakDuration,                  // Durata della pausa (in secondi)
            isRunning: false,               // Lo stato iniziale del timer (non in esecuzione)
            startTime: null,                // Tempo di inizio → nullo finché il timer non parte
            participants: [],               // Lista iniziale dei partecipanti (vuota)
            creatorId: currentUser?.uid || null, // ID del creatore della sessione (se autenticato)
            isStudyTime: true,              // Stato iniziale: modalità studio attiva
            remainingSeconds: studyDuration,// Secondi rimanenti iniziali (pari alla durata studio)
            isActive: true                  // Stato della sessione (attiva al momento della creazione)
        });

        // Restituisce il link della sessione creata
        return link;
    } catch (error) {
        // Se c'è un errore durante la creazione della sessione → lo registra in console e lo rilancia
        console.error("Errore in generateSessionLink:", error);
        throw error;
    }
}