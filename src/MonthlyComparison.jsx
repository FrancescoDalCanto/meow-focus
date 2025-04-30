import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";
import { useAuth } from "./AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { format } from "date-fns";

ChartJS.register(ArcElement, Tooltip, Legend);

function MonthlyComparison({ onClose }) {
    const { currentUser } = useAuth();
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [monthData, setMonthData] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            const col = collection(db, "studyProgress", currentUser.uid, "weeks");
            const snap = await getDocs(col);

            const map = {};

            snap.forEach((docSnap) => {
                const data = docSnap.data();
                if (!Array.isArray(data.days)) return;

                const [year, week] = docSnap.id.split("-W");
                const referenceDay = new Date(+year, 0, 1 + (parseInt(week) - 1) * 7);
                const key = format(referenceDay, "yyyy-MM");

                if (!map[key]) map[key] = { study: 0, pause: 0 };

                data.days.forEach((day) => {
                    map[key].study += day.study || 0;
                    map[key].pause += day.pause || 0;
                });
            });

            setMonthData(map);
        };

        fetchData();
    }, [currentUser]);

    const toggleMonth = (month) => {
        setSelectedMonths((prev) =>
            prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
        );
    };

    const months = Object.keys(monthData).sort();
    const total = selectedMonths.reduce(
        (acc, m) => {
            const d = monthData[m];
            if (!d) return acc;
            acc.study += d.study;
            acc.pause += d.pause;
            return acc;
        },
        { study: 0, pause: 0 }
    );

    const chartData = {
        labels: ["Studio (min)", "Pausa (min)"],
        datasets: [
            {
                data: [total.study, total.pause],
                backgroundColor: ["#8B5CF6", "#F59E0B"],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-900 text-white rounded-xl max-w-2xl w-full p-6 border border-purple-700 max-h-[90vh] overflow-y-auto">                <div className="flex justify-center mb-4 relative">
                <h3 className="text-xl font-bold text-purple-300">Confronto mensile</h3>
                <button
                    onClick={onClose}
                    className="absolute right-0 text-gray-400 hover:text-white text-2xl"
                    aria-label="Chiudi"
                >
                    &times;
                </button>
            </div>

                <p className="text-sm text-gray-400 mb-4">Seleziona i mesi da confrontare</p>

                <div className="flex flex-wrap gap-2 mb-6">
                    {months.map((m) => (
                        <button
                            key={m}
                            onClick={() => toggleMonth(m)}
                            className={`px-3 py-1 rounded-full border ${selectedMonths.includes(m)
                                ? "bg-purple-600 border-purple-400"
                                : "bg-gray-700 border-gray-600"
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                <div className="w-full max-w-md mx-auto">
                    {total.study + total.pause === 0 ? (
                        <p className="text-center text-gray-400">
                            Nessun dato disponibile per i mesi selezionati.
                        </p>
                    ) : (
                        <Pie data={chartData} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default MonthlyComparison;