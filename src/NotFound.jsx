import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-center px-4">
        <img
            src="/page_not_found.png"
            alt="Gattino triste - Pagina non trovata"
            className="w-64 h-auto mb-6 animate-bounce-slow"
        />
        <h1 className="text-5xl md:text-6xl font-extrabold text-purple-400 mb-4">404</h1>
        <p className="text-xl text-gray-300 mb-6">Oops! Pagina non trovata.</p>
        <Link
            to="/"
            className="mt-2 inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow transition duration-300"
        >
            Torna alla Home
        </Link>
       
    </div>
);

export default NotFound;