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
import { format } from "date-fns";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function WeeklyOverview() {
    // Ottiene l'utente attualmente autenticato dal contesto globale
    const { currentUser } = useAuth();
    // Stato per memorizzare tutte le settimane recuperate dal database
    const [allWeeks, setAllWeeks] = useState([]);
    // Stato per memorizzare il mese attualmente selezionato per il filtro
    const [selectedMonth, setSelectedMonth] = useState(null);

    // useEffect che si attiva quando currentUser è disponibile
    useEffect(() => {
        if (!currentUser) return;

        // Funzione asincrona per caricare tutte le settimane dell'utente dal database
        const fetchAllWeeks = async () => {
            // Ottiene la collezione "weeks" relativa all'utente
            const weeksCol = collection(db, "studyProgress", currentUser.uid, "weeks");
            const snap = await getDocs(weeksCol);
            const weeks = [];

            // Cicla ogni documento (settimana)
            for (const docSnap of snap.docs) {
                const data = docSnap.data();

                // Verifica che il documento contenga un array valido di giorni
                if (!data || !Array.isArray(data.days)) continue;

                // Estrae anno e numero della settimana dall'ID (es. "2025-W16")
                const [year, week] = docSnap.id.split("-W");

                // Calcola le date di inizio e fine settimana basandosi sul numero della settimana
                const start = new Date(+year, 0, (parseInt(week) - 1) * 7 + 1);
                const end = new Date(+year, 0, (parseInt(week) - 1) * 7 + 7);

                // Costruisce un'etichetta leggibile con intervallo date (es. "15/04–21/04")
                const label = `${start.toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                })}–${end.toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                })}`;

                // Estrae il mese di riferimento in formato "yyyy-MM" per raggruppamento
                const monthKey = format(start, "yyyy-MM");

                // Inserisce la settimana nell'array con tutti i dati necessari
                weeks.push({
                    id: docSnap.id,     // ID della settimana (es. "2025-W16")
                    label,              // Etichetta visuale dell'intervallo
                    days: data.days,    // Array dei giorni con dati di studio
                    month: monthKey,    // Mese in formato "yyyy-MM"
                });
            }

            // Ordina le settimane dalla più recente alla più vecchia
            weeks.sort((a, b) => (a.id < b.id ? 1 : -1));

            // Aggiorna lo stato con l'elenco completo delle settimane
            setAllWeeks(weeks);
        };

        // Chiama la funzione per caricare le settimane
        fetchAllWeeks();
    }, [currentUser]);

    // Calcola dinamicamente i mesi disponibili tra tutte le settimane
    const monthsAvailable = useMemo(() => {
        const set = new Set();
        allWeeks.forEach((w) => set.add(w.month)); // Aggiunge ogni mese all'insieme
        return Array.from(set).sort((a, b) => new Date(b) - new Date(a)); // Ordina i mesi in ordine decrescente
    }, [allWeeks]);

    // Filtra le settimane da mostrare in base al mese selezionato (o mostra tutte se nessun mese è selezionato)
    const weeksToDisplay = selectedMonth
        ? allWeeks.filter((w) => w.month === selectedMonth)
        : allWeeks;

    // Funzione per costruire i dati da fornire al grafico a barre per una settimana
    const createChartData = (days) => ({
        labels: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"], // Etichette dei giorni
        datasets: [
            {
                label: "Studio (h)",                            // Etichetta della legenda
                data: days.map((d) => (d.study || 0) / 60),     // Valori di studio convertiti da minuti a ore
                backgroundColor: "#a855f7",                     // Colore delle barre
                borderRadius: 5,                                // Arrotondamento delle barre
            },
        ],
    });

    // Opzioni di configurazione per il grafico settimanale
    const options = {
        responsive: true, // Il grafico si adatta alle dimensioni del contenitore
        plugins: {
            legend: { display: true, labels: { color: "#ccc" } }, // Mostra la legenda con testo chiaro
        },
        scales: {
            y: {
                beginAtZero: true,                         // L’asse Y parte da zero
                ticks: { color: "#ccc" },                  // Colore delle etichette asse Y
                grid: { color: "#444" },                   // Colore griglia Y
                title: { display: true, text: "Ore", color: "#ccc" }, // Titolo asse Y
            },
            x: {
                ticks: { color: "#ccc" },                  // Colore etichette asse X
                grid: { color: "#444" },                   // Colore griglia X
            },
        },
    };

    return (
        <div className="bg-gray-800 text-white p-6 rounded-lg shadow w-full max-w-[95vw] sm:max-w-4xl mx-auto box-border overflow-x-auto">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-bold text-purple-400">📊 Tutte le settimane</h2>
                {monthsAvailable.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {monthsAvailable.map((month) => (
                            <button
                                key={month}
                                onClick={() =>
                                    setSelectedMonth((prev) => (prev === month ? null : month))
                                }
                                className={`px-3 py-1 rounded-full border text-sm ${selectedMonth === month
                                    ? "bg-purple-600 border-purple-400"
                                    : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                                    }`}
                            >
                                {month}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {weeksToDisplay.length === 0 ? (
                <p className="text-center text-gray-400 mt-8">
                    Nessun dato disponibile.
                </p>
            ) : (
                <div className="space-y-12">
                    {weeksToDisplay.map((week) => (
                        <div key={week.id}>
                            <h3 className="text-md font-semibold text-purple-300 mb-2">{week.label}</h3>
                            <div style={{ height: 300 }}>
                                <Bar data={createChartData(week.days)} options={options} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default WeeklyOverview;