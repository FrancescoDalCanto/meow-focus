import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import Stanza from './Sessione';
import { useAuth } from './AuthContext';

function SessionPage() {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchSession = async () => {
            if (!currentUser) return;

            try {
                const docRef = doc(db, 'sessions', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();

                    if (!data.startTime) {
                        const now = Date.now();
                        await updateDoc(docRef, { startTime: now });
                        data.startTime = now;
                    }

                    if (currentUser) {
                        await updateDoc(docRef, {
                            participants: arrayUnion({
                                uid: currentUser.uid,
                                email: currentUser.email,
                                joinedAt: new Date().toISOString(),
                            }),
                        });
                    }

                    setSessionData(data);
                } else {
                    setNotFound(true);
                }
            } catch (error) {
                console.error("Errore nel caricamento della sessione:", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, [id, currentUser]);

    if (loading) return <div className="text-white p-8">Caricamento sessione...</div>;
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
