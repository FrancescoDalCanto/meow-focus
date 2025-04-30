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
    // Ottiene l'utente attualmente autenticato
    const { currentUser } = useAuth();
    // Stato che tiene traccia dei mesi selezionati dall'utente per il confronto
    const [selectedMonths, setSelectedMonths] = useState([]);
    // Stato che contiene i dati aggregati di studio per ciascun mese
    const [monthData, setMonthData] = useState({});

    // Effetto per recuperare e aggregare i dati dal database Firestore
    useEffect(() => {
        const fetchMonthAggregates = async () => {
            if (!currentUser) return;

            // Ottiene tutti i documenti della collezione "weeks" per l'utente
            const col = collection(db, "studyProgress", currentUser.uid, "weeks");
            const snap = await getDocs(col);
            const aggregates = {};

            // Scorre ogni documento (settimana)
            snap.forEach((doc) => {
                const data = doc.data();

                // Verifica che ci sia l'array "days"
                if (!Array.isArray(data.days)) return;

                // Estrae anno e numero settimana dall'ID del documento (es. "2025-W15")
                const [year, week] = doc.id.split("-W");

                // Calcola la data di riferimento per la settimana
                const weekDate = new Date(+year, 0, 1 + (parseInt(week) - 1) * 7);

                // Calcola il mese in formato "yyyy-MM" a partire dalla data della settimana
                const monthKey = format(weekDate, "yyyy-MM");

                // Inizializza il mese se non è già presente nell'aggregato
                if (!aggregates[monthKey]) {
                    aggregates[monthKey] = { study: 0 };
                }

                // Somma i minuti di studio per tutti i giorni della settimana
                data.days.forEach((day) => {
                    aggregates[monthKey].study += day.study || 0;
                });
            });

            // Salva i dati aggregati nello stato
            setMonthData(aggregates);
        };

        // Chiama la funzione di recupero dati
        fetchMonthAggregates();
    }, [currentUser]);

    // Gestisce l'aggiunta/rimozione di un mese selezionato (toggle)
    const toggleMonth = (month) => {
        setSelectedMonths((prev) =>
            prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
        );
    };

    // Ordina l'elenco dei mesi disponibili in ordine crescente (da più vecchio a più recente)
    const sortedMonths = useMemo(() => {
        return Object.keys(monthData).sort((a, b) => new Date(a) - new Date(b));
    }, [monthData]);

    // Costruisce l'elenco dei dati filtrati in base ai mesi selezionati
    const filteredData = useMemo(() => {
        return selectedMonths.map((month) => ({
            month,
            study: monthData[month]?.study || 0, // Usa 0 se non ci sono dati per quel mese
        }));
    }, [selectedMonths, monthData]);

    // Configura i dati da visualizzare nel grafico (etichette e valori)
    const chartData = {
        labels: filteredData.map((d) => d.month), // Etichette asse X = mesi selezionati
        datasets: [
            {
                label: "Minuti di studio",
                data: filteredData.map((d) => d.study), // Valori asse Y = minuti
                backgroundColor: "#8B5CF6", // Colore barre
                borderRadius: 5, // Bordo arrotondato per le barre
            },
        ],
    };

    // Opzioni di visualizzazione del grafico
    const chartOptions = {
        responsive: true, // Il grafico si adatta al contenitore
        plugins: {
            legend: { display: false }, // Nasconde la legenda
            tooltip: {
                callbacks: {
                    // Personalizza l'etichetta del tooltip
                    label: (context) => `${context.raw} minuti`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true, // Parte da 0 sull'asse Y
                title: {
                    display: true,
                    text: "Minuti", // Titolo asse Y
                    color: "#ccc",
                },
                ticks: {
                    color: "#ccc", // Colore numeri asse Y
                },
                grid: {
                    color: "#444", // Colore griglia asse Y
                },
            },
            x: {
                ticks: {
                    color: "#ccc", // Colore etichette asse X
                },
                grid: {
                    color: "#444", // Colore griglia asse X
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