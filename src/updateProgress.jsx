import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function updateProgress(uid, year, weekNumber, dayIndex, minutes) {
    // Riferimento al documento della settimana corrente per l'utente (uid) nella collezione "studyProgress"
    const docRef = doc(db, "studyProgress", uid, "weeks", `${year}-W${weekNumber}`);

    // Recupera il documento della settimana corrente
    const snap = await getDoc(docRef);

    // Se il documento esiste → recupera i dati esistenti
    // Altrimenti → crea un oggetto di default con 7 giorni inizializzati a { study: 0 }
    let data = snap.exists()
        ? snap.data()
        : { year, weekNumber, days: Array.from({ length: 7 }, () => ({ study: 0 })) };

    // Copia l'array dei giorni per poterlo aggiornare
    const updated = [...data.days];

    // Se il giorno corrente non esiste (potrebbe succedere in vecchi dati) → inizializza con { study: 0 }
    if (!updated[dayIndex]) updated[dayIndex] = { study: 0 };

    // Aggiunge i minuti di studio al giorno corrente
    updated[dayIndex].study += minutes;

    // Verifica se tutti i giorni della settimana sono a 0 → serve per capire se il documento è "vuoto"
    const isEmpty = updated.every(day => !day.study || day.study === 0);

    if (isEmpty) {
        // Se la settimana è vuota ed esiste già → elimina il documento per non occupare spazio inutile
        if (snap.exists()) {
            await deleteDoc(docRef);
            console.log("Settimana vuota eliminata:", `${year}-W${weekNumber}`);
        }
    } else {
        // Se la settimana ha dati → salva/aggiorna il documento su Firestore
        await setDoc(docRef, { year, weekNumber, days: updated });
        console.log("Settimana salvata:", `${year}-W${weekNumber}`);
    }

    // Notifica ad eventuali altri componenti che i dati sono stati aggiornati → utile per aggiornare grafici o interfaccia
    window.dispatchEvent(new Event("storage-update"));
}