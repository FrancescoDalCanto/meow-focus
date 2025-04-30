import { useState } from "react";
import { Howl } from "howler"; // Usa Howler.js per la gestione della musica

const useLoFiMusic = () => {
    const [isLoFiMusicOn, setIsLoFiMusicOn] = useState(false);

    // Creazione dell'oggetto Howl per la musica LO-FI
    const loFiMusic = new Howl({
        src: ["path_to_lofi_music.mp3"], // Sostituisci con il percorso del tuo file audio LO-FI
        loop: true, // Ripete la musica in loop
    });

    // Funzione per attivare o fermare la musica LO-FI
    const toggleLoFiMusic = () => {
        if (isLoFiMusicOn) {
            loFiMusic.stop(); // Ferma la musica se è già attiva
        } else {
            loFiMusic.play(); // Avvia la musica se non è attiva
        }
        setIsLoFiMusicOn(!isLoFiMusicOn); // Cambia lo stato della musica
    };

    return {
        isLoFiMusicOn,
        toggleLoFiMusic,
    };
};

export default useLoFiMusic;
