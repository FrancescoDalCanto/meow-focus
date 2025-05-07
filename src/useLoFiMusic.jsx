import { useState } from "react";
import { Howl } from "howler"; // Usa Howler.js per la gestione della musica

const useLoFiMusic = () => {
    // Stato locale che indica se la musica LO-FI è attiva (true) o spenta (false)
    const [isLoFiMusicOn, setIsLoFiMusicOn] = useState(false);

    // Creazione dell'oggetto Howl per gestire la riproduzione della musica LO-FI
    const loFiMusic = new Howl({
        src: ["path_to_lofi_music.mp3"], // Percorso del file audio LO-FI da riprodurre (da sostituire con il file reale)
        loop: true,                     // La musica viene riprodotta in loop continuo finché non viene fermata
    });

    // Funzione per attivare o fermare la musica LO-FI
    const toggleLoFiMusic = () => {
        if (isLoFiMusicOn) {
            loFiMusic.stop(); // Se la musica è già in riproduzione → fermala
        } else {
            loFiMusic.play(); // Se la musica non è in riproduzione → avviala
        }
        setIsLoFiMusicOn(!isLoFiMusicOn); // Aggiorna lo stato → inverte isLoFiMusicOn (true -> false o false -> true)
    };

    // Esporta lo stato e la funzione toggle per l'utilizzo in altri componenti o hook
    return {
        isLoFiMusicOn,    // Indica se la musica LO-FI è attualmente in riproduzione
        toggleLoFiMusic,  // Funzione per avviare/fermare la musica
    };
};

export default useLoFiMusic;
