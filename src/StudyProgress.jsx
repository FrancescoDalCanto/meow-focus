// ==========================
// Componente: StudyProgress (corretto)
// Mostra solo i minuti di studio (niente pause)
// ==========================

import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { useAuth } from "./AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { getWeeksOfCurrentMonth } from "./CalendarUtils";
import MonthlyComparison from "./MonthlyComparison";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StudyProgress = () => {
    const [weekData, setWeekData] = useState(null);
    const [currentWeekId, setCurrentWeekId] = useState(null);
    const [availableWeeks, setAvailableWeeks] = useState([]);
    const [showMonthComparison, setShowMonthComparison] = useState(false);
    const { currentUser } = useAuth();

    const getCurrentWeekId = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = (now - start) / 86400000;
        const weekNumber = Math.ceil((diff + start.getDay() + 1) / 7);
        const year = now.getFullYear();
        return { year, weekNumber, docId: `${year}-W${weekNumber}` };
    };

    useEffect(() => {
        if (!currentUser) return;

        const { docId } = getCurrentWeekId();
        setCurrentWeekId(docId);

        const updateWeeks = () => {
            setAvailableWeeks(getWeeksOfCurrentMonth());
        };

        updateWeeks();

        const interval = setInterval(updateWeeks, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser || !currentWeekId) return;

        const loadFromFirestore = async () => {
            const ref = doc(db, "studyProgress", currentUser.uid, "weeks", currentWeekId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                if (
                    typeof data === "object" &&
                    Array.isArray(data.days) &&
                    data.days.length === 7 &&
                    data.days.every((d) => typeof d.study === "number")
                ) {
                    setWeekData(data);
                } else {
                    console.warn("Dati in formato non valido, ignorati.");
                }
            } else {
                setWeekData(null);
                console.warn("Nessun dato di progresso trovato.");
            }
        };

        loadFromFirestore();
    }, [currentUser, currentWeekId]);

    const labels = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

    const chartData = {
        labels,
        datasets: [
            {
                label: "Studio (h)",
                data: weekData ? weekData.days.map((d) => d.study / 60) : [],
                backgroundColor: "#8B5CF6",
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 6,
                ticks: {
                    callback: (value) => `${value}h`,
                    color: "#9CA3AF",
                },
                grid: {
                    color: "#374151",
                    borderDash: [4],
                },
            },
            x: {
                ticks: {
                    color: "#E5E7EB",
                },
                grid: {
                    display: false,
                },
            },
        },
        plugins: {
            legend: {
                labels: {
                    color: "#E5E7EB",
                },
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${Math.round(ctx.raw * 60)} min`,
                },
            },
        },
    };

    return (
        <div className="bg-gray-800 text-white p-6 rounded-lg shadow w-full max-w-4xl mx-auto relative">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-purple-400 mb-1">Progresso settimanale</h2>
                <p className="text-sm text-gray-400">Settimana selezionata: {currentWeekId || "-"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    {availableWeeks.map(({ docId, label }) => (
                        <button
                            key={docId}
                            onClick={() => setCurrentWeekId(docId)}
                            className={`px-3 py-1 text-sm rounded-full border ${docId === currentWeekId
                                ? "bg-purple-600 border-purple-400"
                                : "bg-gray-700 border-gray-600"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {weekData ? (
                <div style={{ height: 400 }}>
                    <Bar data={chartData} options={options} />
                </div>
            ) : (
                <p className="text-center text-gray-400 mt-8">
                    Nessun dato disponibile per questa settimana.
                </p>
            )}

            <div className="text-center mt-8">
                <button
                    onClick={() => setShowMonthComparison(true)}
                    className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg text-white"
                >
                    Confronta mesi
                </button>
            </div>

            {showMonthComparison && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
                    <MonthlyComparison onClose={() => setShowMonthComparison(false)} />
                </div>
            )}
        </div>
    );
};

export default StudyProgress;
