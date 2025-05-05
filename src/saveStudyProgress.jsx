import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

async function saveStudyProgress(uid, weekId, weekNumber, year, days) {
    const isEmpty = days.every(day => !day.study || day.study === 0);

    const weekRef = doc(db, "studyProgress", uid, "weeks", weekId);

    if (isEmpty) {
        // Se tutti i giorni sono vuoti → elimina il documento se esiste
        await deleteDoc(weekRef);
        console.log("Settimana vuota, eliminata dal database:", weekId);
    } else {
        // Altrimenti salva normalmente
        await setDoc(weekRef, {
            weekNumber,
            year,
            days
        });
        console.log("Settimana salvata:", weekId);
    }
}