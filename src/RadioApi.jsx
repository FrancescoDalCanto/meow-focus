import React, { useEffect, useState } from 'react';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;;

function RadioAPI() {
    // Stato che memorizza la lista dei video recuperati dall'API di YouTube
    const [videos, setVideos] = useState([]);
    // Stato che memorizza il video attualmente selezionato
    const [selectedVideo, setSelectedVideo] = useState(null);
    // Stato che memorizza eventuali errori durante il recupero dei video
    const [error, setError] = useState(null);

    /**
     * useEffect → viene eseguito una sola volta al montaggio del componente
     * Effettua una richiesta all'API di YouTube per cercare video LO-FI
     */
    useEffect(() => {
        // Funzione asincrona per recuperare i video da YouTube
        async function fetchVideos() {
            // Query di ricerca: musica LO-FI chill
            const query = "musica lofi chill beats";

            // Costruzione URL della richiesta API YouTube
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoEmbeddable=true&maxResults=5&key=${API_KEY}`;

            try {
                // Esegue la richiesta HTTP
                const res = await fetch(url);
                const data = await res.json();

                if (data.error) {
                    // Se la risposta contiene un errore → registra l'errore e aggiorna lo stato
                    console.error(data.error);
                    setError("Errore nella chiamata API");
                } else {
                    // Se la richiesta ha successo → salva i video e seleziona il primo per autoplay
                    setVideos(data.items);
                    setSelectedVideo(data.items[0]);
                }
            } catch (err) {
                // Gestione errori di rete o fetch
                console.error("Errore nella chiamata fetch:", err);
                setError("Errore di rete");
            }
        }

        // Esegue la funzione di fetch al caricamento del componente
        fetchVideos();
    }, []); // Dipendenza vuota → eseguito solo una volta

    return (
        <div className="p-4">
            <h2 className="text-white text-xl font-bold mb-4">🎧 Radio LoFi (API YouTube)</h2>

            {error && <p className="text-red-400">{error}</p>}

            {selectedVideo && (
                <div className="mb-6 ">
                    <iframe width="0" height="0" style={{ display: "none" }} src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}`} title="LoFi Music" allow="autoplay" />

                    <p className="text-purple-300 mt-2">{selectedVideo.snippet.title}</p>
                </div>
            )}

            <div className="grid gap-2">
                {videos.map((video) => (
                    <button
                        key={video.id.videoId}
                        onClick={() => setSelectedVideo(video)}
                        className="text-left text-sm text-white hover:text-purple-400 transition"
                    >
                        • {video.snippet.title}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default RadioAPI;