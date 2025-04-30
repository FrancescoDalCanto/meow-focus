import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import App from './App';
import User from './User';
import Stanza from './Sessione';
import NotFound from './NotFound';
import AdminPage from './AdminPage';
import AdminAnalytics from './AdminAnalytics'; // <-- aggiunto qui
import { AuthProvider } from './AuthContext';
import { RedirectProvider } from './RedirectContext';
import PrivateRoute from './PrivateRoute';
import OnlineWrapper from './OnlineWrapper';

const MainLayout = () => (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <main className="flex-1">
            <Outlet />
        </main>
    </div>
);

const ProtectedLayout = () => (
    <PrivateRoute>
        <MainLayout />
    </PrivateRoute>
);

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <OnlineWrapper>
            <BrowserRouter>
                <AuthProvider>
                    <RedirectProvider>
                        <Routes>
                            {/* Layout pubblico */}
                            <Route element={<MainLayout />}>
                                <Route path="/" element={<App />} />
                                <Route path="/login" element={<App initialTab="login" />} />
                                <Route path="/register" element={<App initialTab="register" />} />
                                <Route path="/admin" element={<AdminPage />} />
                                <Route path="/admin-analytics" element={<AdminAnalytics />} /> {/* <-- aggiunta questa */}
                                <Route path="*" element={<NotFound />} />
                            </Route>

                            {/* Layout protetto */}
                            <Route element={<ProtectedLayout />}>
                                <Route path="/user" element={<User />} />
                                <Route path="/stanza" element={<Stanza />} />
                                <Route path="/session/:id" element={<Stanza />} />
                            </Route>
                        </Routes>
                    </RedirectProvider>
                </AuthProvider>
            </BrowserRouter>
        </OnlineWrapper>
    </StrictMode>
);



if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registrato con successo:', registration);
            })
            .catch((error) => {
                console.error('Errore durante la registrazione del Service Worker:', error);
            });
    });
}