import React, { useEffect, useState, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from "chart.js";
import { useAuth } from "./AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { format, startOfISOWeek, addWeeks, endOfISOWeek } from "date-fns";
import MonthlyComparison from "./MonthlyComparison";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function StudyProgress() {
    // Ottiene l'utente attualmente autenticato dal contesto globale
    const { currentUser } = useAuth();

    // Stato che memorizza tutte le settimane (caricate o generate) con i dati di studio
    const [allWeeks, setAllWeeks] = useState([]);

    // Stato per il mese selezionato (usato per filtrare le settimane)
    const [selectedMonth, setSelectedMonth] = useState(null);

    // Stato per decidere se mostrare il confronto tra mesi
    const [showMonthlyComparison, setShowMonthlyComparison] = useState(false);

    // Stato per memorizzare l'ID della settimana attualmente selezionata (per il grafico)
    const [selectedWeekId, setSelectedWeekId] = useState(null);

    /**
     * useEffect → recupera e genera tutte le settimane dell'utente
     * Si attiva ogni volta che l'utente corrente diventa disponibile
     */
    useEffect(() => {
        if (!currentUser) return; // Esce se l'utente non è autenticato

        // Funzione asincrona per recuperare le settimane dal database
        const fetchAllWeeks = async () => {
            const weeksCol = collection(db, "studyProgress", currentUser.uid, "weeks");
            const snap = await getDocs(weeksCol);
            const weeks = [];

            // Scorre tutti i documenti recuperati da Firestore
            for (const docSnap of snap.docs) {
                const data = docSnap.data();
                if (!data || !Array.isArray(data.days)) continue; // Salta se il documento è vuoto o non valido

                const [year, week] = docSnap.id.split("-W");
                const parsedYear = parseInt(year);
                const parsedWeek = parseInt(week);

                // Calcola la data di inizio e fine settimana in base al numero ISO della settimana
                const firstThursday = new Date(parsedYear, 0, 4);
                const startOfWeek = addWeeks(startOfISOWeek(firstThursday), parsedWeek - 1);
                const endOfWeek = endOfISOWeek(startOfWeek);

                // Crea l'etichetta leggibile per l'intervallo di date della settimana
                const label = `${startOfWeek.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}–${endOfWeek.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}`;

                // Determina il mese di riferimento per raggruppare le settimane
                const monthKey = format(endOfWeek, "yyyy-MM");

                // Aggiunge la settimana all'elenco
                weeks.push({
                    id: docSnap.id,      // ID univoco 
                    label,               // Etichetta visiva con le date
                    days: data.days,     // Dati dei giorni della settimana
                    month: monthKey,     // Mese di appartenenza in formato "yyyy-MM"
                });
            }

            // Ordina le settimane dalla più recente alla più vecchia
            weeks.sort((a, b) => (a.id < b.id ? 1 : -1));

            // Calcola il numero della settimana corrente dell'anno
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const todayDiff = (now - startOfYear) / 86400000;
            const currentWeekNumber = Math.ceil((todayDiff + startOfYear.getDay() + 1) / 7);

            const generatedWeeks = [];

            // Genera le settimane mancanti (non salvate) fino alla settimana attuale
            for (let week = 1; week <= currentWeekNumber; week++) {
                const weekId = `${now.getFullYear()}-W${week}`;

                if (!weeks.find(w => w.id === weekId)) {
                    const firstThursday = new Date(now.getFullYear(), 0, 4);
                    const startOfWeek = addWeeks(startOfISOWeek(firstThursday), week - 1);
                    const endOfWeek = endOfISOWeek(startOfWeek);

                    const label = `${startOfWeek.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}–${endOfWeek.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}`;
                    const monthKey = format(endOfWeek, "yyyy-MM");

                    generatedWeeks.push({
                        id: weekId,
                        label,
                        days: Array.from({ length: 7 }, () => ({ study: 0 })), // Settimana vuota
                        month: monthKey,
                    });
                }
            }

            // Unisce le settimane caricate e quelle generate
            const completeWeeks = [...weeks, ...generatedWeeks];

            // Ordina le settimane con priorità alle non vuote
            completeWeeks.sort((a, b) => {
                const aEmpty = a.days.every(day => !day.study || day.study === 0);
                const bEmpty = b.days.every(day => !day.study || day.study === 0);
                if (aEmpty && !bEmpty) return 1;
                if (!aEmpty && bEmpty) return -1;
                return a.id < b.id ? 1 : -1;
            });

            // Salva le settimane complete nello stato
            setAllWeeks(completeWeeks);

            // 👉 Imposta la settimana corrente come selezionata di default
            const currentWeekId = `${now.getFullYear()}-W${currentWeekNumber}`;
            setSelectedWeekId(currentWeekId);
        };

        fetchAllWeeks(); // Esegue il caricamento delle settimane
    }, [currentUser]);

    /**
     * Calcola dinamicamente i mesi disponibili tra tutte le settimane caricate
     * → Utilizzato per il filtro dei mesi
     */
    const monthsAvailable = useMemo(() => {
        const set = new Set();
        allWeeks.forEach((w) => set.add(w.month)); // Raccoglie tutti i mesi unici
        return Array.from(set).sort((a, b) => new Date(b) - new Date(a)); // Ordina dal più recente
    }, [allWeeks]);

    /**
     * Filtra le settimane da mostrare in base al mese selezionato
     * - Se nessun mese è selezionato → mostra tutte le settimane
     */
    const weeksFilteredByMonth = selectedMonth
        ? allWeeks.filter((w) => w.month === selectedMonth)
        : allWeeks;

    // Trova l'indice della settimana selezionata tra le settimane filtrate
    const currentWeekIndex = weeksFilteredByMonth.findIndex((w) => w.id === selectedWeekId);

    /**
     * Determina le settimane da visualizzare
     * - Se è selezionata una settimana specifica → mostra solo quella
     * - Altrimenti → mostra tutte le settimane filtrate
     */
    const weeksToDisplay = selectedWeekId
        ? weeksFilteredByMonth.filter((w) => w.id === selectedWeekId)
        : weeksFilteredByMonth;

    /**
     * Seleziona la settimana precedente rispetto a quella corrente
     * - Solo se non si è già arrivati all'ultima settimana
     */
    const goToPreviousWeek = () => {
        if (currentWeekIndex < weeksFilteredByMonth.length - 1) {
            setSelectedWeekId(weeksFilteredByMonth[currentWeekIndex + 1].id);
        }
    };

    /**
     * Seleziona la settimana successiva rispetto a quella corrente
     * - Solo se non si è già arrivati alla prima settimana
     */
    const goToNextWeek = () => {
        if (currentWeekIndex > 0) {
            setSelectedWeekId(weeksFilteredByMonth[currentWeekIndex - 1].id);
        }
    };

    /**
     * Prepara i dati per il grafico a barre della settimana selezionata
     * - Etichette giorni → Lunedì-Domenica
     * - Dati → ore di studio (da minuti a ore)
     */
    const createChartData = (days) => ({
        labels: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
        datasets: [
            {
                label: "Studio (h)",                            // Etichetta della serie
                data: days.map((d) => (d.study || 0) / 60),     // Conversione dei minuti in ore
                backgroundColor: "#a855f7",                     // Colore delle barre
                borderRadius: 5,                                // Arrotondamento delle barre
            },
        ],
    });

    /**
     * Opzioni di configurazione per il grafico a barre
     * - Include tooltip personalizzati per mostrare ore e minuti
     * - Gestisce colori, titoli e griglie
     */
    const options = {
        responsive: true, // Il grafico si adatta alle dimensioni del contenitore
        plugins: {
            legend: {
                display: true, // Mostra la legenda
                labels: { color: "#ccc" } // Colore del testo della legenda
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        // Recupera il valore grezzo
                        const rawValue = context.raw;
                        // Calcola le ore intere
                        const hours = Math.floor(rawValue);
                        // Calcola i minuti residui (parte decimale * 60)
                        const minutes = Math.round((rawValue - hours) * 60);
                        // Ritorna il testo formattato per il tooltip
                        return `Studio: ${hours}h ${minutes}m`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true, // L'asse Y parte da 0
                ticks: {
                    color: "#ccc", // Colore delle etichette Y
                    // Callback per personalizzare le etichette dei tick sull'asse Y
                    callback: function (value) {
                        const hours = Math.floor(value); // Ore intere
                        const minutes = Math.round((value - hours) * 60); // Minuti residui

                        // Se i minuti sono 0, mostra solo le ore
                        if (minutes === 0) {
                            return `${hours}h`;
                        }
                        // Altrimenti mostra ore e minuti
                        return `${hours}h ${minutes}m`;
                    }
                },
                grid: { color: "#444" }, // Colore della griglia Y
                title: {
                    display: true, // Mostra il titolo dell'asse
                    text: "Ore", // Testo del titolo asse Y
                    color: "#ccc" // Colore del titolo
                },
            },
            x: {
                ticks: { color: "#ccc" }, // Colore delle etichette X
                grid: { color: "#444" }, // Colore della griglia X
            },
        },
    };

    return (
        <div className="bg-gray-800 text-white p-6 rounded-lg shadow w-full max-w-[95vw] sm:max-w-4xl mx-auto relative overflow-x-auto box-border">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-bold text-purple-400">📊 Tutte le settimane</h2>
                <div className="flex flex-wrap gap-2">
                    {monthsAvailable.map((month) => (
                        <button
                            key={month}
                            onClick={() => {
                                setSelectedMonth((prev) => (prev === month ? null : month));
                                setSelectedWeekId(null);
                            }}
                            className={`px-3 py-1 rounded-full border text-sm ${selectedMonth === month
                                ? "bg-purple-600 border-purple-400"
                                : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                                }`}
                        >
                            {month}
                        </button>
                    ))}
                </div>
            </div>

            {weeksFilteredByMonth.length > 0 && (
                <div className="mb-8 flex items-center gap-3 justify-center flex-wrap">




                    <button
                        onClick={goToPreviousWeek}
                        disabled={currentWeekIndex === weeksFilteredByMonth.length - 1}
                        className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-600 transition"
                    >
                        ← Prec
                    </button>

                    {selectedWeekId && (
                        <div className="bg-purple-700 text-white px-4 py-1 rounded-full text-sm font-semibold">
                            {weeksFilteredByMonth[currentWeekIndex]?.label}
                        </div>
                    )}

                    <button
                        onClick={goToNextWeek}
                        disabled={currentWeekIndex <= 0}
                        className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-600 transition"
                    >
                        Succ →
                    </button>
                </div>
            )}

            {weeksToDisplay.length === 0 ? (
                <p className="text-center text-gray-400 mt-8">Nessun dato disponibile.</p>
            ) : (
                <div className="space-y-12">
                    {weeksToDisplay.map((week) => (
                        <div key={week.id}>
                            <h3 className="text-md font-semibold text-purple-300 mb-2">{week.label}</h3>
                            {week.days.every(d => !d.study || d.study === 0) ? (
                                <p className="text-center text-gray-500">Nessun dato per questa settimana.</p>
                            ) : (
                                <div style={{ height: 300 }}>
                                    <Bar data={createChartData(week.days)} options={options} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="text-center mt-12">
                <button
                    onClick={() => {
                        if (!selectedMonth) {
                            // Se nessun mese è selezionato, imposta il mese corrente
                            const currentMonth = format(new Date(), "yyyy-MM");
                            setSelectedMonth(currentMonth);
                        }
                        setShowMonthlyComparison(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg text-white"
                >
                    Confronta mesi
                </button>
            </div>

            {showMonthlyComparison && (
                <MonthlyComparison onClose={() => setShowMonthlyComparison(false)} />
            )}
        </div>
    );
}

export default StudyProgress;