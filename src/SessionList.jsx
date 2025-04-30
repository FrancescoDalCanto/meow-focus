import React from "react";

function SessionList({ sessions, onStart, onDelete }) {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 mt-8">
            {sessions.map((session) => (
                <div key={session.id} className="bg-gray-800 p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-semibold text-purple-300">{session.name}</h2>
                        <span
                            className={`h-3 w-3 rounded-full inline-block ${session.isActive ? "bg-green-400" : "bg-red-400"}`}
                            title={session.isActive ? "Attiva" : "Non attiva"}
                        />
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                        Studio: {Math.floor((session.studyDuration || 1500) / 60)} min • Pausa: {Math.floor((session.breakDuration || 300) / 60)} min
                    </p>
                    <button
                        onClick={() => onStart(session)}
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-bold w-full"
                    >
                        ▶️ Avvia singola sessione
                    </button>
                    <button
                        onClick={() => onDelete(session.id)}
                        className="bg-red-600 hover:bg-red-700 mt-2 px-4 py-2 rounded text-white font-bold w-full"
                    >
                        🗑 Elimina sessione
                    </button>
                    <p className="text-green-400 mt-3 break-all text-sm">
                        Link: <a href={`/session/${session.id}`} className="underline">{window.location.origin}/session/{session.id}</a>
                    </p>
                </div>
            ))}
        </div>
    );
}

export default SessionList;