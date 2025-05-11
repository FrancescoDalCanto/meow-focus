import React, { useState } from 'react';

const JoinSession = ({ onClose, onJoin }) => {
    // Stato che memorizza l'URL inserito dall'utente per la sessione
    const [sessionUrl, setSessionUrl] = useState('');
    // Stato che indica se è in corso la validazione dell'URL (usato per mostrare un loader o disabilitare il form)
    const [isValidating, setIsValidating] = useState(false);
    // Stato che memorizza eventuali messaggi di errore (es. URL non valido o mancante)
    const [error, setError] = useState('');

    /**
     * Funzione che verifica se una stringa è un URL valido
     * - Tenta di creare un oggetto URL
     * - Se riesce → restituisce true
     * - Se fallisce → restituisce false (URL non valido)
     */
    const validateUrl = (url) => {
        try {
            new URL(url); // Prova a creare un URL
            return true;  // URL valido
        } catch {
            return false; // URL non valido
        }
    };

    /**
     * Gestisce l'invio del form per entrare in una sessione
     * - Esegue validazione dell'URL
     * - Mostra errori se l'URL è mancante o non valido
     * - Se valido → attende 800ms e poi esegue l'azione di join
     */
    const handleSubmit = (e) => {
        e.preventDefault(); // Previene il comportamento di invio predefinito del form
        setIsValidating(true); // Imposta la validazione come in corso
        setError(''); // Pulisce eventuali errori precedenti

        // Controlla se l'utente ha inserito un URL
        if (!sessionUrl) {
            setError('Inserisci un link della sessione');
            setIsValidating(false);
            return;
        }

        // Controlla se l'URL inserito è valido
        if (!validateUrl(sessionUrl)) {
            setError('Inserisci un URL valido (inizia con http:// o https://)');
            setIsValidating(false);
            return;
        }

        // Simula un breve ritardo prima di completare l'azione (es. per UX o caricamento)
        setTimeout(() => {
            setIsValidating(false); // Fine validazione

            if (onJoin) {
                // Se è presente una funzione di join → la chiama con l'URL inserito
                onJoin(sessionUrl);
            } else {
                // Altrimenti → reindirizza direttamente l'utente all'URL
                window.location.href = sessionUrl;
            }

            // Chiude il popup (presumibilmente la finestra/modal corrente)
            closePopup();
        }, 800);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl max-w-md w-full border border-purple-500/30 shadow-2xl overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
                            <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 13a5 5 0 007.9 1.6l2.4-2.4a5 5 0 00-7.1-7.1L12 7m2 2l-2 2m4 4l-2 2M7 11a5 5 0 00-1.6 7.9l2.4 2.4a5 5 0 007.1-7.1L13 12" />
                            </svg>
                            Unisciti a una sessione
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                            aria-label="Chiudi"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="sessionUrl" className="block text-purple-300 mb-2">
                                Link della sessione
                            </label>
                            <div className="relative">
                                <input
                                    id="sessionUrl"
                                    type="url"
                                    value={sessionUrl}
                                    onChange={(e) => setSessionUrl(e.target.value)}
                                    className="w-full bg-gray-700 text-white p-3 pl-10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    placeholder="https://meowfocus.com/session/abc123"
                                    autoFocus
                                />
                                <svg
                                    className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 13a5 5 0 007.9 1.6l2.4-2.4a5 5 0 00-7.1-7.1L12 7m2 2l-2 2m4 4l-2 2M7 11a5 5 0 00-1.6 7.9l2.4 2.4a5 5 0 007.1-7.1L13 12" />
                                </svg>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Inserisci il link condiviso dall'organizzatore
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                disabled={isValidating}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${isValidating
                                    ? 'bg-purple-800 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg'
                                    }`}
                            >
                                {isValidating ? (
                                    <>
                                        <span className="animate-spin">↻</span>
                                        Convalida...
                                    </>
                                ) : (
                                    <>
                                        Unisciti ora
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-gray-900/50 px-6 py-4 text-center border-t border-gray-700">
                    <p className="text-gray-400 text-sm">
                        Non hai un link? Chiedilo all'organizzatore della sessione.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default JoinSession;