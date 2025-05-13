import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import App from './App';
import User from './User';
import Stanza from './Sessione';
import NotFound from './NotFound';
import AdminPage from './AdminPage';
import { AuthProvider } from './AuthContext';
import { RedirectProvider } from './RedirectContext';
import PrivateRoute from './PrivateRoute';
import OnlineWrapper from './OnlineWrapper';

// Componente principale del layout pubblico
// - Imposta uno sfondo scuro e il testo bianco
// - Definisce un'area principale che renderizza i contenuti dinamici tramite <Outlet />
const MainLayout = () => (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <main className="flex-1">
            <Outlet /> {/* Qui verranno mostrati i componenti delle rotte figlie */}
        </main>
    </div>
);

// Componente layout protetto
// - Avvolge MainLayout con PrivateRoute, che gestisce l'accesso solo a utenti autenticati
const ProtectedLayout = () => (
    <PrivateRoute>
        <MainLayout />
    </PrivateRoute>
);

// Punto di ingresso principale dell'app React
// - Monta l'applicazione React nel nodo con id "root"
createRoot(document.getElementById('root')).render(
    <StrictMode>
        {/* OnlineWrapper → verifica se l'utente è online */}
        <OnlineWrapper>
            <BrowserRouter>
                {/* AuthProvider → fornisce il contesto per gestire autenticazione */}
                <AuthProvider>
                    {/* RedirectProvider → gestisce i redirect dopo login/registrazione */}
                    <RedirectProvider>
                        <Routes>

                            {/* Gruppo di rotte con layout pubblico (MainLayout) */}
                            <Route element={<MainLayout />}>

                                {/* Pagina principale */}
                                <Route path="/" element={<App />} />

                                {/* Pagina di login → App con tab "login" selezionato */}
                                <Route path="/login" element={<App initialTab="login" />} />

                                {/* Pagina di registrazione → App con tab "register" selezionato */}
                                <Route path="/register" element={<App initialTab="register" />} />

                                {/* Pagina admin → solo visibile se l'utente ha accesso (gestito internamente) */}
                                <Route path="/admin" element={<AdminPage />} />

                                {/* Rotta catch-all → qualsiasi percorso non definito mostra la pagina NotFound */}
                                <Route path="*" element={<NotFound />} />
                            </Route>

                            {/* Gruppo di rotte protette → accessibili solo dopo autenticazione */}
                            <Route element={<ProtectedLayout />}>

                                {/* Pagina utente personale */}
                                <Route path="/user" element={<User />} />

                                {/* Pagina "Stanza" per sessioni generiche */}
                                <Route path="/sessions" element={<Stanza />} />

                                {/* Pagina "Stanza" per sessioni specifiche tramite ID */}
                                <Route path="/session/:id" element={<Stanza />} />
                            </Route>

                        </Routes>
                    </RedirectProvider>
                </AuthProvider>
            </BrowserRouter>
        </OnlineWrapper>
    </StrictMode>
);

// Verifica se il browser supporta i service worker
// - Se supportati, registra il service worker alla fine del caricamento della pagina
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                // Registrazione avvenuta con successo
                console.log('Service Worker registrato con successo:', registration);
            })
            .catch((error) => {
                // Errore durante la registrazione del service worker
                console.error('Errore durante la registrazione del Service Worker:', error);
            });
    });
}