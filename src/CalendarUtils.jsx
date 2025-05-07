import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    addDays,
    format,
    getISOWeek,
    getYear,
    isSameMonth,
} from "date-fns";

export function getWeeksOfCurrentMonth() {
    // Ottiene la data corrente
    const now = new Date();

    // Calcola l'inizio del mese corrente 
    const monthStart = startOfMonth(now);

    // Calcola la fine del mese corrente 
    const monthEnd = endOfMonth(now);

    // Array che conterrà le informazioni sulle settimane del mese
    const weeks = [];

    // Calcola l'inizio della prima settimana del mese
    // - La settimana inizia di lunedì (weekStartsOn: 1)
    let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 });

    /**
     * Cicla fino a quando la settimana corrente non supera la fine del mese
     * - Ogni iterazione rappresenta una settimana
     */
    while (currentWeekStart <= monthEnd) {
        // Calcola la fine della settimana corrente → 6 giorni dopo l'inizio
        const currentWeekEnd = addDays(currentWeekStart, 6);

        // Ottiene il numero ISO della settimana 
        const weekNumber = getISOWeek(currentWeekStart);

        // Ottiene l'anno della settimana corrente
        const year = getYear(currentWeekStart);

        // Crea l'ID del documento con formato "Anno-Settimana" 
        const docId = `${year}-W${String(weekNumber).padStart(2, "0")}`;

        // Crea un'etichetta leggibile che rappresenta l'intervallo di date della settimana 
        const label = `${format(currentWeekStart, "dd/MM")}–${format(currentWeekEnd, "dd/MM")}`;

        // Aggiunge la settimana all'elenco solo se:
        // - L'inizio o la fine della settimana sono nello stesso mese corrente
        if (isSameMonth(currentWeekStart, now) || isSameMonth(currentWeekEnd, now)) {
            weeks.push({ docId, label });
        }

        // Passa alla settimana successiva → aggiungendo 7 giorni
        currentWeekStart = addDays(currentWeekStart, 7);
    }

    // Restituisce l'elenco delle settimane del mese con ID e label
    return weeks;
}