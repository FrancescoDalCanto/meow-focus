import React, { useEffect, useState } from 'react';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;;

function RadioAPI() {
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchVideos() {
            const query = "musica lofi chill beats";
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoEmbeddable=true&maxResults=5&key=${API_KEY}`;

            try {
                const res = await fetch(url);
                const data = await res.json();

                if (data.error) {
                    console.error(data.error);
                    setError("Errore nella chiamata API");
                } else {
                    setVideos(data.items);
                    setSelectedVideo(data.items[0]); // autoplay primo video
                }
            } catch (err) {
                console.error("Errore nella chiamata fetch:", err);
                setError("Errore di rete");
            }
        }

        fetchVideos();
    }, []);

    return (
        <div className="p-4">
            <h2 className="text-white text-xl font-bold mb-4">🎧 Radio LoFi (API YouTube)</h2>

            {error && <p className="text-red-400">{error}</p>}

            {selectedVideo && (
                <div className="mb-6">
                    <iframe
                        width="100%"
                        height="250"
                        src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1&mute=0`}
                        title={selectedVideo.snippet.title}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        className="rounded-lg shadow-lg"
                    />
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