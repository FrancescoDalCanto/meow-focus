import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

function ActiveSessions({ sessions, openLoginPopup }) {
    const [searchTerm, setSearchTerm] = useState("");
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleJoinSession = (sessionId) => {
        if (currentUser) {
            navigate(`/session/${sessionId}`);
        } else {
            openLoginPopup(sessionId);
        }
    };

    const filteredSessions = sessions.filter(session =>
        session.name && session.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Cerca sessioni..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700 text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <svg
                        className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {filteredSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                        <svg
                            className="h-12 w-12 mb-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m4-2a8 8 0 11-16 0 8 8 0 0116 0z" />
                        </svg>
                        <p>Nessuna sessione trovata</p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="mt-2 text-purple-400 hover:text-purple-300"
                            >
                                Cancella ricerca
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredSessions.map((session) => (
                            <div
                                key={session.id}
                                className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200 group"
                            >
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-white truncate">
                                        {session.name}
                                    </h3>
                                    <div className="flex items-center mt-1 text-sm text-gray-400">
                                        <svg
                                            className="mr-1 h-4 w-4"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <span>{session.participants} {session.participants === 1 ? "partecipante" : "partecipanti"}</span>
                                        {session.duration && (
                                            <>
                                                <span className="mx-2">•</span>
                                                <svg
                                                    className="mr-1 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m4-2a8 8 0 11-16 0 8 8 0 0116 0z" />
                                                </svg>
                                                <span>{session.duration} min</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleJoinSession(session.id)}
                                    className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-all duration-200 flex items-center group-hover:bg-purple-700"
                                >
                                    Unisciti
                                    <svg
                                        className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Custom scrollbar styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #6b46c1;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #805ad5;
                }
            `}</style>
        </div>
    );
}

export default ActiveSessions;