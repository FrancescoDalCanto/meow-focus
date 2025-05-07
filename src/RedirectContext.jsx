import { createContext, useContext, useState } from "react";

// Crea un contesto globale per gestire il redirect alla sessione dopo il login o altre azioni
const RedirectContext = createContext();

/**
 * Provider del contesto Redirect
 * - Fornisce ai componenti figli l'accesso a redirectSessionId e alla funzione per aggiornarlo (setRedirectSessionId)
 */
export const RedirectProvider = ({ children }) => {
    // Stato per memorizzare l'id della sessione a cui reindirizzare (null se non è previsto alcun redirect)
    const [redirectSessionId, setRedirectSessionId] = useState(null);

    return (
        <RedirectContext.Provider value={{ redirectSessionId, setRedirectSessionId }}>
            {children}
        </RedirectContext.Provider>
    );
};

/**
 * Hook personalizzato per accedere facilmente al contesto Redirect
 * - Permette ai componenti di leggere o aggiornare redirectSessionId
 */
export const useRedirect = () => useContext(RedirectContext);