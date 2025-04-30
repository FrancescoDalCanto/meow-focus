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
import MonthlyComparison from "./MonthlyComparison"; // ⬅ assicurati che il path sia corretto

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function StudyProgress() {
    // Ottiene l'utente attualmente autenticato dal contesto
    const { currentUser } = useAuth();
    // Stato per contenere tutte le settimane caricate dal database
    const [allWeeks, setAllWeeks] = useState([]);
    // Stato che rappresenta il mese selezionato dall'utente (es. "2025-04")
    const [selectedMonth, setSelectedMonth] = useState(null);
    // Stato per mostrare o nascondere il popup di confronto mensile
    const [showMonthlyComparison, setShowMonthlyComparison] = useState(false);

    // Effetto che si attiva quando currentUser è disponibile
    useEffect(() => {
        if (!currentUser) return;

        // Funzione asincrona che legge tutte le settimane dal database
        const fetchAllWeeks = async () => {
            const weeksCol = collection(db, "studyProgress", currentUser.uid, "weeks");
            const snap = await getDocs(weeksCol);
            const weeks = [];

            // Cicla tutti i documenti della collezione "weeks"
            for (const docSnap of snap.docs) {
                const data = docSnap.data();

                // Salta il documento se non ha un array valido di giorni
                if (!data || !Array.isArray(data.days)) continue;

                // Estrae anno e numero della settimana dal nome del documento (es. "2025-W15")
                const [year, week] = docSnap.id.split("-W");

                // Calcola data di inizio e fine settimana basandosi sul numero della settimana
                const start = new Date(+year, 0, (parseInt(week) - 1) * 7 + 1);
                const end = new Date(+year, 0, (parseInt(week) - 1) * 7 + 7);

                // Crea una label visiva del tipo "01/04–07/04"
                const label = `${start.toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                })}–${end.toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                })}`;

                // Estrae il mese in formato "yyyy-MM" per usarlo nel filtro
                const monthKey = format(start, "yyyy-MM");

                // Aggiunge la settimana all'array con id, label, giorni e mese
                weeks.push({
                    id: docSnap.id,
                    label,
                    days: data.days,
                    month: monthKey,
                });
            }

            // Ordina le settimane in ordine decrescente (più recente prima)
            weeks.sort((a, b) => (a.id < b.id ? 1 : -1));

            // Aggiorna lo stato con tutte le settimane raccolte
            setAllWeeks(weeks);
        };

        // Avvia la funzione di caricamento
        fetchAllWeeks();
    }, [currentUser]);

    // Crea dinamicamente l'elenco dei mesi disponibili tra tutte le settimane
    const monthsAvailable = useMemo(() => {
        const set = new Set();
        allWeeks.forEach((w) => set.add(w.month)); // Aggiunge il mese all'insieme
        return Array.from(set).sort((a, b) => new Date(b) - new Date(a)); // Ordina i mesi in ordine decrescente
    }, [allWeeks]);

    // Applica il filtro in base al mese selezionato, altrimenti mostra tutte le settimane
    const weeksToDisplay = selectedMonth
        ? allWeeks.filter((w) => w.month === selectedMonth)
        : allWeeks;

    // Crea i dati da passare al grafico per una settimana specifica
    const createChartData = (days) => ({
        labels: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"], // Etichette dei giorni
        datasets: [
            {
                label: "Studio (h)", // Etichetta del dataset
                data: days.map((d) => (d.study || 0) / 60), // Converte minuti in ore
                backgroundColor: "#a855f7", // Colore delle barre
                borderRadius: 5, // Arrotondamento degli angoli
            },
        ],
    });

    // Opzioni di configurazione per il grafico settimanale
    const options = {
        responsive: true,
        plugins: {
            legend: { display: true, labels: { color: "#ccc" } }, // Legenda visibile e di colore chiaro
        },
        scales: {
            y: {
                beginAtZero: true, // L’asse Y parte da 0
                ticks: { color: "#ccc" }, // Colore delle etichette sull’asse Y
                grid: { color: "#444" }, // Colore griglia Y
                title: { display: true, text: "Ore", color: "#ccc" }, // Titolo asse Y
            },
            x: {
                ticks: { color: "#ccc" }, // Colore delle etichette sull’asse X
                grid: { color: "#444" }, // Colore griglia X
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
            </div>

            {weeksToDisplay.length === 0 ? (
                <p className="text-center text-gray-400 mt-8">
                    Nessun dato disponibile.
                </p>
            ) : (
                <div className="space-y-12">
                    {weeksToDisplay.map((week) => (
                        <div key={week.id}>
                            <h3 className="text-md font-semibold text-purple-300 mb-2">
                                {week.label}
                            </h3>
                            <div style={{ height: 300 }}>
                                <Bar data={createChartData(week.days)} options={options} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="text-center mt-12">
                <button
                    onClick={() => setShowMonthlyComparison(true)}
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