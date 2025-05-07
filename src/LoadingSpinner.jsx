const LoadingSpinner = ({ size = 'md' }) => {
    // Oggetto che definisce le classi di dimensione disponibili per il componente
    // - "sm": piccolo
    // - "md": medio
    // - "lg": grande
    const sizes = {
        sm: 'h-6 w-6',   // Altezza e larghezza 6 (piccolo)
        md: 'h-8 w-8',   // Altezza e larghezza 8 (medio)
        lg: 'h-12 w-12'  // Altezza e larghezza 12 (grande)
    };

    // Ritorna un elemento <div> che funge da spinner di caricamento
    // - Applica animazione di rotazione continua (animate-spin)
    // - Applica bordi superiore e inferiore colorati (border-t-2, border-b-2, border-purple-500)
    // - Applica la dimensione in base al valore di "size" ricevuto (es. sm, md, lg)
    return (
        <div className={`animate-spin rounded-full border-t-2 border-b-2 border-purple-500 ${sizes[size]}`}></div>
    );
};

export default LoadingSpinner;