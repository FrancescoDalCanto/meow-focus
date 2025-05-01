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
    const { currentUser } = useAuth();
    const [allWeeks, setAllWeeks] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [showMonthlyComparison, setShowMonthlyComparison] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        const fetchAllWeeks = async () => {
            const weeksCol = collection(db, "studyProgress", currentUser.uid, "weeks");
            const snap = await getDocs(weeksCol);
            const weeks = [];

            for (const docSnap of snap.docs) {
                const data = docSnap.data();

                if (!data || !Array.isArray(data.days)) continue;

                const [year, week] = docSnap.id.split("-W");
                const parsedYear = parseInt(year);
                const parsedWeek = parseInt(week);

                // Calcola inizio settimana ISO
                const firstThursday = new Date(parsedYear, 0, 4); // 4 Gennaio è garantito nella settimana 1 ISO
                const startOfWeek = addWeeks(startOfISOWeek(firstThursday), parsedWeek - 1);
                const endOfWeek = endOfISOWeek(startOfWeek);

                const label = `${startOfWeek.toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                })}–${endOfWeek.toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                })}`;

                const monthKey = format(startOfWeek, "yyyy-MM");

                weeks.push({
                    id: docSnap.id,
                    label,
                    days: data.days,
                    month: monthKey,
                });
            }

            weeks.sort((a, b) => (a.id < b.id ? 1 : -1));
            setAllWeeks(weeks);
        };

        fetchAllWeeks();
    }, [currentUser]);

    const monthsAvailable = useMemo(() => {
        const set = new Set();
        allWeeks.forEach((w) => set.add(w.month));
        return Array.from(set).sort((a, b) => new Date(b) - new Date(a));
    }, [allWeeks]);

    const weeksToDisplay = selectedMonth
        ? allWeeks.filter((w) => w.month === selectedMonth)
        : allWeeks;

    const createChartData = (days) => ({
        labels: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
        datasets: [
            {
                label: "Studio (h)",
                data: days.map((d) => (d.study || 0) / 60),
                backgroundColor: "#a855f7",
                borderRadius: 5,
            },
        ],
    });

    const options = {
        responsive: true,
        plugins: {
            legend: { display: true, labels: { color: "#ccc" } },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: "#ccc" },
                grid: { color: "#444" },
                title: { display: true, text: "Ore", color: "#ccc" },
            },
            x: {
                ticks: { color: "#ccc" },
                grid: { color: "#444" },
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