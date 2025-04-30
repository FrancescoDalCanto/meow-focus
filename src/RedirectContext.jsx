import { createContext, useContext, useState } from "react";

const RedirectContext = createContext();

export const RedirectProvider = ({ children }) => {
    const [redirectSessionId, setRedirectSessionId] = useState(null);

    return (
        <RedirectContext.Provider value={{ redirectSessionId, setRedirectSessionId }}>
            {children}
        </RedirectContext.Provider>
    );
};

export const useRedirect = () => useContext(RedirectContext);