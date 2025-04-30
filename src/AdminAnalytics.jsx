import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function AdminAnalytics() {
    const [userProgress, setUserProgress] = useState([]);

    useEffect(() => {
        const fetchUserProgress = async () => {
            try {
                const snapshot = await getDocs(collection(db, "studyProgress"));
                const users = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUserProgress(users);
            } catch (error) {
                console.error("Errore nel caricamento dei dati:", error);
            }
        };

        fetchUserProgress();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold text-purple-400 mb-8">📊 Analisi Utilizzo Utenti</h1>
            <div className="grid gap-6">
                {userProgress.length > 0 ? (
                    userProgress.map(user => (
                        <div key={user.id} className="bg-gray-800 p-6 rounded-lg shadow">
                            <h2 className="text-xl font-semibold text-purple-300 mb-2">
                                {user.id}
                            </h2>
                            <pre className="text-sm text-gray-400 overflow-x-auto">
                                {JSON.stringify(user, null, 2)}
                            </pre>
                        </div>
                    ))
                ) : (
                    <p>Nessun dato disponibile.</p>
                )}
            </div>
        </div>
    );
}

export default AdminAnalytics;