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

    // Hook di stato che memorizza tutte le settimane recuperate dal database (usato per il grafico e la selezione)
    const [allWeeks, setAllWeeks] = useState([]);

    // Hook di stato per il mese selezionato dall'utente (usato per filtrare le settimane mostrate)
    const [selectedMonth, setSelectedMonth] = useState(null);

    /**
     * useEffect → viene eseguito quando currentUser diventa disponibile
     * Recupera tutte le settimane relative all'utente autenticato da Firestore
     */
    useEffect(() => {
        if (!currentUser) return; // Se non c'è un utente → esce

        // Funzione asincrona per caricare tutte le settimane dal database
        const fetchAllWeeks = async () => {
            // Ottiene il riferimento alla collezione "weeks" dell'utente
            const weeksCol = collection(db, "studyProgress", currentUser.uid, "weeks");
            const snap = await getDocs(weeksCol); // Recupera tutti i documenti (settimane)
            const weeks = [];

            // Scorre ogni documento (settimana)
            for (const docSnap of snap.docs) {
                const data = docSnap.data();

                // Se i dati non esistono o non sono validi → salta questo documento
                if (!data || !Array.isArray(data.days)) continue;

                // Estrae anno e numero settimana dall'ID del documento (esempio "2025-W16")
                const [year, week] = docSnap.id.split("-W");

                // Calcola la data di inizio e fine settimana basandosi sul numero settimana
                const start = new Date(+year, 0, (parseInt(week) - 1) * 7 + 1);
                const end = new Date(+year, 0, (parseInt(week) - 1) * 7 + 7);

                // Crea un'etichetta leggibile per l'intervallo della settimana (esempio "15/04–21/04")
                const label = `${start.toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                })}–${end.toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                })}`;

                // Determina il mese della settimana in formato "yyyy-MM" per raggruppamento e filtro
                const monthKey = format(start, "yyyy-MM");

                // Aggiunge le informazioni della settimana all'elenco
                weeks.push({
                    id: docSnap.id,     // ID univoco della settimana (es. "2025-W16")
                    label,              // Etichetta visiva dell'intervallo date
                    days: data.days,    // Array dei giorni con dati di studio
                    month: monthKey,    // Mese di riferimento in formato "yyyy-MM"
                });
            }

            // Ordina le settimane in ordine decrescente (dalla più recente alla più vecchia)
            weeks.sort((a, b) => (a.id < b.id ? 1 : -1));

            // Aggiorna lo stato con tutte le settimane caricate
            setAllWeeks(weeks);
        };

        // Esegue la funzione di caricamento delle settimane
        fetchAllWeeks();
    }, [currentUser]); // Si aggiorna solo quando currentUser cambia

    /**
     * Calcola dinamicamente i mesi disponibili basandosi sulle settimane caricate
     * → Utile per generare il filtro dei mesi
     */
    const monthsAvailable = useMemo(() => {
        const set = new Set(); // Usa un Set per evitare duplicati

        allWeeks.forEach((w) => set.add(w.month)); // Aggiunge ogni mese presente

        // Converte il Set in array e lo ordina in ordine decrescente (dal più recente)
        return Array.from(set).sort((a, b) => new Date(b) - new Date(a));
    }, [allWeeks]);

    /**
     * Filtra le settimane in base al mese selezionato
     * - Se nessun mese è selezionato → mostra tutte le settimane
     * - Altrimenti → mostra solo quelle del mese selezionato
     */
    const weeksToDisplay = selectedMonth
        ? allWeeks.filter((w) => w.month === selectedMonth)
        : allWeeks;

    /**
     * Funzione per creare i dati necessari al grafico a barre settimanale
     * - Prepara le etichette dei giorni e i dati di studio (convertiti in ore)
     */
    const createChartData = (days) => ({
        labels: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"], // Giorni della settimana (in italiano)
        datasets: [
            {
                label: "Studio (h)",                            // Nome della serie di dati
                data: days.map((d) => (d.study || 0) / 60),     // Dati → minuti convertiti in ore
                backgroundColor: "#a855f7",                     // Colore delle barre del grafico
                borderRadius: 5,                                // Angoli arrotondati delle barre
            },
        ],
    });

    /**
     * Configurazione delle opzioni del grafico settimanale
     * - Include legenda, aspetto assi, griglie e titoli
     */
    const options = {
        responsive: true, // Il grafico si adatta alle dimensioni del contenitore
        plugins: {
            legend: { display: true, labels: { color: "#ccc" } }, // Visualizza la legenda con colore chiaro
        },
        scales: {
            y: {
                beginAtZero: true,                         // L'asse Y parte da 0
                ticks: { color: "#ccc" },                  // Colore delle etichette asse Y
                grid: { color: "#444" },                   // Colore della griglia asse Y
                title: { display: true, text: "Ore", color: "#ccc" }, // Titolo asse Y
            },
            x: {
                ticks: { color: "#ccc" },                  // Colore delle etichette asse X
                grid: { color: "#444" },                   // Colore della griglia asse X
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