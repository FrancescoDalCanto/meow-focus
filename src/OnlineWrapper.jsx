import { useEffect, useState } from "react";
import Fallback from "./FallBack";

const OnlineWrapper = ({ children }) => {
    // Stato che tiene traccia della connessione internet dell'utente
    // Viene inizializzato con lo stato attuale della connessione (navigator.onLine restituisce true se online, false se offline)
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    /**
     * useEffect → viene eseguito una sola volta al montaggio del componente
     * - Aggiunge listener per rilevare i cambiamenti di stato della rete (online/offline)
     * - Aggiorna lo stato isOnline in base alla connessione
     */
    useEffect(() => {
        // Funzione da chiamare quando il dispositivo torna online
        const handleOnline = () => setIsOnline(true);
        // Funzione da chiamare quando il dispositivo va offline
        const handleOffline = () => setIsOnline(false);
        
        // Aggiunge i listener agli eventi di rete del browser
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Cleanup → rimuove i listener quando il componente viene smontato
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []); // Dipendenza vuota → eseguito solo una volta al montaggio

    /**
     * Render → mostra i children solo se l'utente è online
     * - Se offline → mostra il componente <Fallback /> al posto dei children
     */
    return isOnline ? children : <Fallback />;
};

export default OnlineWrapper;