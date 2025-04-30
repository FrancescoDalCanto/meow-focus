import { db } from './firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from './firebase';

export default async function generateSessionLink({ studyDuration, breakDuration }) {
    const sessionId = Math.random().toString(36).substring(2, 10);
    const currentUser = auth.currentUser;

    const link = `http://localhost:5173/session/${sessionId}`;

    try {
        await setDoc(doc(collection(db, 'globalSessions'), sessionId), {
            createdAt: serverTimestamp(),
            studyDuration,
            breakDuration,
            isRunning: false,
            startTime: null,
            participants: [],
            creatorId: currentUser?.uid || null,
            isStudyTime: true,
            remainingSeconds: studyDuration,
            isActive: true
        });

        return link;
    } catch (error) {
        console.error("Errore in generateSessionLink:", error);
        throw error;
    }
}