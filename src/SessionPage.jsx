import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import Stanza from './Sessione';
import { useAuth } from './AuthContext';

function SessionPage() {
    // Ottiene il parametro "id" dalla URL tramite React Router (identifica la sessione)
    const { id } = useParams();
    // Ottiene l'utente attualmente autenticato
    const { currentUser } = useAuth();
    // Stato per memorizzare i dati della sessione caricata da Firestore
    const [sessionData, setSessionData] = useState(null);
    // Stato per indicare se i dati della sessione sono ancora in fase di caricamento
    const [loading, setLoading] = useState(true);
    // Stato per indicare se la sessione non è stata trovata (es. ID non valido)
    const [notFound, setNotFound] = useState(false);

    /**
     * useEffect → si attiva quando l'utente corrente o l'id della sessione cambiano
     * Carica i dati della sessione da Firestore e aggiorna lo stato locale
     */
    useEffect(() => {
        // Funzione asincrona per recuperare i dati della sessione
        const fetchSession = async () => {
            // Se l'utente non è autenticato → esce senza fare nulla
            if (!currentUser) return;

            try {
                // Recupera il riferimento al documento della sessione da Firestore
                const docRef = doc(db, 'sessions', id);
                const docSnap = await getDoc(docRef); // Ottiene il documento

                if (docSnap.exists()) {
                    // Se il documento esiste → estrae i dati
                    const data = docSnap.data();

                    // Se la sessione non ha ancora un "startTime" → lo imposta con il timestamp attuale
                    if (!data.startTime) {
                        const now = Date.now();
                        await updateDoc(docRef, { startTime: now });
                        data.startTime = now; // Aggiorna anche localmente i dati
                    }

                    // Se l'utente corrente è autenticato → aggiunge l'utente ai partecipanti della sessione
                    if (currentUser) {
                        await updateDoc(docRef, {
                            participants: arrayUnion({
                                uid: currentUser.uid,                // ID utente
                                email: currentUser.email,           // Email utente
                                joinedAt: new Date().toISOString(), // Timestamp di ingresso nella sessione
                            }),
                        });
                    }

                    // Salva i dati della sessione nello stato
                    setSessionData(data);
                } else {
                    // Se il documento non esiste → segna come "non trovata"
                    setNotFound(true);
                }
            } catch (error) {
                // Se c'è un errore durante il caricamento → stampa errore e segna come "non trovata"
                console.error("Errore nel caricamento della sessione:", error);
                setNotFound(true);
            } finally {
                // Imposta loading a false → indica che il caricamento è terminato
                setLoading(false);
            }
        };

        // Esegue la funzione per caricare la sessione
        fetchSession();
    }, [id, currentUser]); // Si ri-esegue se cambia l'id o l'utente corrente

    // Renderizza un messaggio di caricamento se la sessione è in fase di caricamento
    if (loading) return <div className="text-white p-8">Caricamento sessione...</div>;

    // Renderizza un messaggio di errore se la sessione non è stata trovata
    if (notFound) return <div className="text-purple-500 p-8">Sessione non trovata.</div>;

    return (
        <Stanza
            initialStudy={sessionData.studyDuration / 60}
            initialBreak={sessionData.breakDuration / 60}
            sessionId={id}
            startTime={sessionData.startTime}
            ownerId={sessionData.ownerId}
        />
    );
}

export default SessionPage;
