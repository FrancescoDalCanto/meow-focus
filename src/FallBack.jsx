function Fallback() {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-8">
            <img
                src="/fall_back.png"
                alt="Errore di connessione"
                className="max-w-xs mb-4"
            />
            <h2 className="text-2xl font-semibold mb-2">Oops! Qualcosa è andato storto.</h2>
            <p className="text-gray-600">Controlla la tua connessione o riprova più tardi.</p>
        </div>
    );
}

export default Fallback;