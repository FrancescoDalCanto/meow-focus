import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingSpinner from './LoadingSpinner'; // Nuovo componente per il loading

const PrivateRoute = ({ children, roles = [] }) => {
  // Ottiene informazioni sull'utente autenticato, lo stato di caricamento e gli eventuali errori tramite il context personalizzato useAuth
  const { currentUser, loading, error } = useAuth();

  // Ottiene la location corrente dal router, utile per gestire i redirect mantenendo la pagina di origine
  const location = useLocation();

  /**
   * Se il caricamento dell'autenticazione è ancora in corso
   * → Mostra uno spinner di caricamento professionale con messaggio
   */
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 z-50">
        <LoadingSpinner /> {/* Componente spinner */}
        <span className="ml-3 text-purple-400">Verifica dell'autenticazione...</span>
      </div>
    );
  }

  /**
   * Se c'è stato un errore durante il processo di autenticazione
   * → Mostra un messaggio di errore con possibilità di riprovare
   */
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 z-50">
        <div className="bg-gray-800 p-6 rounded-xl border border-red-500 max-w-md text-center">
          <h3 className="text-xl font-bold text-red-400 mb-2">Errore di autenticazione</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()} // Ricarica la pagina per riprovare
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  /**
   * Se l'utente non è autenticato
   * → Esegue il redirect alla pagina di login mantenendo la route originale
   */
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /**
   * Se l'utente è autenticato ma non ha i ruoli richiesti (se previsti)
   * → Mostra messaggio di "Accesso negato" e reindirizza alla home
   */
  if (roles.length > 0 && !roles.some(role => currentUser.roles?.includes(role))) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 z-50">
        <div className="bg-gray-800 p-6 rounded-xl border border-yellow-500 max-w-md text-center">
          <h3 className="text-xl font-bold text-yellow-400 mb-2">Accesso negato</h3>
          <p className="text-gray-300 mb-4">Non hai i permessi necessari per accedere a questa pagina</p>
          <Navigate to="/" /> {/* Redirect automatico alla home */}
        </div>
      </div>
    );
  }

  /**
   * Se tutte le condizioni sono soddisfatte (utente autenticato e con i permessi corretti)
   * → Renderizza i children passati al componente
   */
  return children;
};

export default PrivateRoute;