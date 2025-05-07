import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

async function saveStudyProgress(uid, weekId, weekNumber, year, days) {
    // Verifica se tutti i giorni della settimana sono vuoti (ossia senza minuti di studio)
    // → true se ogni giorno ha "study" nullo o pari a 0
    const isEmpty = days.every(day => !day.study || day.study === 0);

    // Ottiene il riferimento al documento della settimana specifica nello schema del database
    const weekRef = doc(db, "studyProgress", uid, "weeks", weekId);

    if (isEmpty) {
        // Se tutti i giorni sono vuoti → elimina il documento dal database (se esiste)
        await deleteDoc(weekRef);
        console.log("Settimana vuota, eliminata dal database:", weekId);
    } else {
        // Altrimenti (la settimana ha almeno un giorno con dati) → salva/aggiorna il documento su Firestore
        await setDoc(weekRef, {
            weekNumber,  // Numero della settimana
            year,        // Anno di riferimento
            days         // Array dei giorni con i dati di studio
        });
        console.log("Settimana salvata:", weekId);
    }
}