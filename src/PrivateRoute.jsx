import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingSpinner from './LoadingSpinner'; // Nuovo componente per il loading

const PrivateRoute = ({ children, roles = [] }) => {
  const { currentUser, loading, error } = useAuth();
  const location = useLocation();

  // Mostra uno spinner di caricamento professionale
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 z-50">
        <LoadingSpinner />
        <span className="ml-3 text-purple-400">Verifica dell'autenticazione...</span>
      </div>
    );
  }

  // Gestione degli errori di autenticazione
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 z-50">
        <div className="bg-gray-800 p-6 rounded-xl border border-red-500 max-w-md text-center">
          <h3 className="text-xl font-bold text-red-400 mb-2">Errore di autenticazione</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  // Se l'utente non è autenticato, reindirizza alla login mantenendo la route originale
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Controllo dei ruoli (opzionale)
  if (roles.length > 0 && !roles.some(role => currentUser.roles?.includes(role))) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 z-50">
        <div className="bg-gray-800 p-6 rounded-xl border border-yellow-500 max-w-md text-center">
          <h3 className="text-xl font-bold text-yellow-400 mb-2">Accesso negato</h3>
          <p className="text-gray-300 mb-4">Non hai i permessi necessari per accedere a questa pagina</p>
          <Navigate to="/" />
        </div>
      </div>
    );
  }

  // Se tutto è ok, renderizza i children
  return children;
};

export default PrivateRoute;