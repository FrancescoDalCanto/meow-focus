import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function updateProgress(uid, year, weekNumber, dayIndex, minutes) {
    const docRef = doc(db, "studyProgress", uid, "weeks", `${year}-W${weekNumber}`);
    const snap = await getDoc(docRef);

    let data = snap.exists()
        ? snap.data()
        : { year, weekNumber, days: Array.from({ length: 7 }, () => ({ study: 0 })) };

    const updated = [...data.days];
    if (!updated[dayIndex]) updated[dayIndex] = { study: 0 };

    updated[dayIndex].study += minutes;

    const isEmpty = updated.every(day => !day.study || day.study === 0);

    if (isEmpty) {
        if (snap.exists()) {
            await deleteDoc(docRef);
            console.log("Settimana vuota eliminata:", `${year}-W${weekNumber}`);
        }
    } else {
        await setDoc(docRef, { year, weekNumber, days: updated });
        console.log("Settimana salvata:", `${year}-W${weekNumber}`);
    }

    window.dispatchEvent(new Event("storage-update"));
}