import { useRef, useState } from "react";
import { Howl } from "howler";

const useLoFiMusic = () => {
    // Stato che indica se la musica LoFi è attualmente attiva o no
    const [isLoFiMusicOn, setIsLoFiMusicOn] = useState(false);

    // Ref che mantiene l'oggetto Howl in modo persistente tra i render
    const loFiMusicRef = useRef(null);

    // Inizializza l'oggetto Howl una sola volta, alla prima esecuzione dell'hook
    if (!loFiMusicRef.current) {
        loFiMusicRef.current = new Howl({
            src: ["/audio/lofi.mp3"], // Percorso del file audio da riprodurre (puoi sostituirlo con un URL o un altro path)
            loop: true,               // Ripeti il brano in loop continuo
            html5: true,              // Obbliga l’uso dell’audio HTML5 per supportare autoplay in background su mobile/browser moderni
            volume: 0.4               // Imposta un volume di default (puoi modificarlo in base alle preferenze utente)
        });
    }

    // Funzione che attiva o disattiva la riproduzione musicale
    const toggleLoFiMusic = () => {
        const loFiMusic = loFiMusicRef.current;

        if (isLoFiMusicOn) {
            loFiMusic.pause(); // Se la musica è attiva, la mettiamo in pausa (non la fermiamo completamente)
        } else {
            loFiMusic.play();  // Se la musica è spenta, la avviamo
        }

        // Inverti lo stato per riflettere la nuova condizione (ON ↔ OFF)
        setIsLoFiMusicOn(!isLoFiMusicOn);
    };

    // Esponi lo stato e la funzione toggle per l’uso in altri componenti
    return {
        isLoFiMusicOn,     // booleano: true se la musica è attiva
        toggleLoFiMusic,   // funzione per attivare o disattivare la musica
    };
};

export default useLoFiMusic;