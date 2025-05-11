import React, { useState, useEffect, useMemo } from "react";
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

function MonthlyComparison({ onClose }) {
    // Recupera l'utente attualmente autenticato
    const { currentUser } = useAuth();
    // Stato che tiene traccia dei mesi selezionati dall'utente per il confronto tra mesi
    const [selectedMonths, setSelectedMonths] = useState([]);
    // Stato che contiene i dati aggregati di studio (in minuti) per ogni mese
    const [monthData, setMonthData] = useState({});

    /**
     * useEffect → recupera e aggrega i dati delle settimane dal database Firestore
     * - Viene eseguito ogni volta che currentUser cambia (es. al login/logout)
     */
    useEffect(() => {
        const fetchMonthAggregates = async () => {
            if (!currentUser) return; // Se non c'è utente, non eseguire

            // Ottiene tutti i documenti della collezione "weeks" dell'utente
            const col = collection(db, "studyProgress", currentUser.uid, "weeks");
            const snap = await getDocs(col);

            const aggregates = {};

            // Scorre tutti i documenti (settimane) recuperati
            snap.forEach((doc) => {
                const data = doc.data();

                // Verifica che il documento contenga l'array "days"
                if (!Array.isArray(data.days)) return;

                // Estrae anno e numero settimana dall'id (es. "2025-W15")
                const [year, week] = doc.id.split("-W");
                // Calcola la data di riferimento della settimana (usata per calcolare il mese)
                const weekDate = new Date(+year, 0, 1 + (parseInt(week) - 1) * 7);
                // Determina il mese della settimana in formato "yyyy-MM"
                const monthKey = format(weekDate, "yyyy-MM");

                // Se il mese non è ancora presente → inizializza con studio = 0
                if (!aggregates[monthKey]) {
                    aggregates[monthKey] = { study: 0 };
                }

                // Somma i minuti di studio di tutti i giorni della settimana
                data.days.forEach((day) => {
                    aggregates[monthKey].study += day.study || 0;
                });
            });

            // Aggiorna lo stato con i dati aggregati
            setMonthData(aggregates);
        };

        // Esegue il recupero dei dati
        fetchMonthAggregates();
    }, [currentUser]);

    /**
     * Funzione per aggiungere o rimuovere un mese selezionato (toggle)
     * - Se il mese è già selezionato → lo rimuove
     * - Altrimenti → lo aggiunge
     */
    const toggleMonth = (month) => {
        setSelectedMonths((prev) =>
            prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
        );
    };

    /**
     * Calcola l'elenco ordinato dei mesi disponibili in ordine cronologico
     * - Utilizza useMemo per evitare ricalcoli inutili
     */
    const sortedMonths = useMemo(() => {
        return Object.keys(monthData).sort((a, b) => new Date(a) - new Date(b));
    }, [monthData]);

    /**
     * Costruisce l'elenco dei dati filtrati per i mesi selezionati
     * - Contiene il mese e i minuti di studio associati
     */
    const filteredData = useMemo(() => {
        return selectedMonths.map((month) => ({
            month,
            study: monthData[month]?.study || 0, // Se non ci sono dati → assume 0
        }));
    }, [selectedMonths, monthData]);

    /**
     * Prepara i dati per il grafico a barre
     * - Contiene le etichette dei mesi e i minuti di studio per ogni mese selezionato
     */
    const chartData = {
        labels: filteredData.map((d) => d.month), // Etichette asse X: mesi selezionati
        datasets: [
            {
                label: "Minuti di studio", // Etichetta del dataset
                data: filteredData.map((d) => d.study), // Valori asse Y: minuti di studio
                backgroundColor: "#8B5CF6", // Colore barre
                borderRadius: 5, // Bordo arrotondato per le barre
            },
        ],
    };

    /**
     * Opzioni di configurazione per il grafico
     * - Imposta stili, griglie, tooltip personalizzati e altre opzioni
     */
    const chartOptions = {
        responsive: true, // Rende il grafico adattabile al contenitore
        plugins: {
            legend: { display: false }, // Nasconde la legenda
            tooltip: {
                callbacks: {
                    // Personalizza il tooltip per mostrare ore e minuti
                    label: function (context) {
                        const rawValue = context.raw;
                        const hours = Math.floor(rawValue); // Ore intere
                        const minutes = Math.round((rawValue - hours) * 60); // Minuti residui
                        return `Studio: ${hours}h ${minutes}m`;
                    }
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true, // L'asse Y parte da 0
                title: {
                    display: true,
                    text: "Ore", // Cambiato da "Minuti" a "Ore" perché ora mostriamo ore e minuti
                    color: "#ccc",
                },
                ticks: {
                    color: "#ccc", // Colore delle etichette sull'asse Y
                    // Aggiunto callback per formattare le etichette
                    callback: function (value) {
                        const hours = Math.floor(value); // Ore intere
                        const minutes = Math.round((value - hours) * 60); // Minuti

                        // Se minuti = 0, mostra solo ore (es. "2h")
                        if (minutes === 0) {
                            return `${hours}h`;
                        }

                        // Se ore = 0, mostra solo minuti (es. "15m")
                        if (hours === 0) {
                            return `${minutes}m`;
                        }

                        // Altrimenti mostra ore e minuti (es. "2h 30m")
                        return `${hours}h ${minutes}m`;
                    }
                },
                grid: {
                    color: "#444", // Colore della griglia dell'asse Y
                },
            },
            x: {
                ticks: {
                    color: "#ccc", // Colore delle etichette sull'asse X
                },
                grid: {
                    color: "#444", // Colore della griglia dell'asse X
                },
            },
        },
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-900 text-white rounded-xl max-w-3xl w-full p-6 border border-purple-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-center mb-4 relative">
                    <h3 className="text-xl font-bold text-purple-300">Confronto mensile</h3>
                    <button
                        onClick={onClose}
                        className="absolute right-0 text-gray-400 hover:text-white text-2xl"
                        aria-label="Chiudi il confronto mensile"
                        title="Chiudi"
                    >
                        &times;
                    </button>
                </div>

                <p className="text-sm text-gray-400 mb-4">
                    Seleziona uno o più mesi da confrontare:
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                    {sortedMonths.map((month) => (
                        <button
                            key={month}
                            onClick={() => toggleMonth(month)}
                            className={`px-3 py-1 rounded-full border transition ${selectedMonths.includes(month)
                                ? "bg-purple-600 border-purple-400"
                                : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                                }`}
                        >
                            {month}
                        </button>
                    ))}
                </div>

                <div className="w-full max-w-2xl mx-auto">
                    {filteredData.length === 0 || filteredData.every((d) => d.study === 0) ? (
                        <p className="text-center text-gray-400">
                            Nessun dato disponibile per i mesi selezionati.
                        </p>
                    ) : (
                        <Bar data={chartData} options={chartOptions} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default MonthlyComparison;