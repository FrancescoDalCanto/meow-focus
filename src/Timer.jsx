import React, { useEffect, useRef, useState } from "react";
import { doc, updateDoc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";

function StudyBreakTimer({ studyDuration, breakDuration, sessionId, sync, canControl }) {
  // Ottiene l'utente attualmente autenticato
  const { currentUser } = useAuth();
  // Stato per determinare se è il momento di studio
  const [isStudyTime, setIsStudyTime] = useState(true);
  // Stato per i secondi rimanenti
  const [secondsLeft, setSecondsLeft] = useState(0);
  // Stato per indicare se il timer è in esecuzione
  const [isRunning, setIsRunning] = useState(false);
  // Riferimento per memorizzare l'ID dell'intervallo
  const intervalRef = useRef(null);
  // Riferimento per memorizzare l'inizio dell'ultima sessione
  const lastSessionStart = useRef(Date.now());

  //TODO: da rimuovere
  // Riferimenti per gli elementi audio (suoni di fine sessione)
  const studyAudioRef = useRef(null);
  const breakAudioRef = useRef(null);

  // Riferimenti per i suoni di pre-avviso (avvisano che la sessione sta per finire)
  const pauseSoonAudioRef = useRef(null);
  const studySoonAudioRef = useRef(null);

  // Flag per evitare che il suono di pre-avviso venga riprodotto più volte
  const hasPlayedSoonAudio = useRef(false);

  // Imposta una durata massima sicura per evitare errori (es. timer eccessivamente lunghi)
  const MAX_DURATION = 86400;
  const safeStudyDuration = Math.min(studyDuration, MAX_DURATION);
  const safeBreakDuration = Math.min(breakDuration, MAX_DURATION);

  // Funzione per ottenere i dati della settimana corrente (anno, numero settimana e giorno)
  const getCurrentWeekData = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = (now - start) / 86400000;
    const weekNumber = Math.ceil((diff + start.getDay() + 1) / 7);
    const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    return { year: now.getFullYear(), weekNumber, dayIndex };
  };

  // Aggiorna i progressi di studio sul database
  const updateProgress = async (seconds) => {
    if (!currentUser || seconds <= 0) return;
    const { year, weekNumber, dayIndex } = getCurrentWeekData();
    const docRef = doc(db, "studyProgress", currentUser.uid, "weeks", `${year}-W${weekNumber}`);
    const snap = await getDoc(docRef);
    let data = snap.exists()
      ? snap.data()
      : { year, weekNumber, days: Array.from({ length: 7 }, () => ({ study: 0 })) };

    const updated = [...data.days];
    if (!updated[dayIndex]) updated[dayIndex] = { study: 0 };
    if (typeof updated[dayIndex].study !== "number") updated[dayIndex].study = 0;
    updated[dayIndex].study += Math.round(seconds / 60);

    await setDoc(docRef, { year, weekNumber, days: updated });
    window.dispatchEvent(new Event("storage-update")); // Aggiorna la visualizzazione
  };

  // Salva i minuti di studio se necessario (es. quando si mette in pausa o finisce una sessione)
  const saveStudyIfNeeded = async () => {
    const elapsedSeconds = Math.floor((Date.now() - lastSessionStart.current) / 1000);
    if (isStudyTime && elapsedSeconds > 0) {
      await updateProgress(elapsedSeconds);
    }
  };

  // Imposta il timer iniziale quando cambia modalità studio/pausa o se la sincronizzazione è disattivata
  useEffect(() => {
    if (!sync) {
      const newDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
      setSecondsLeft(newDuration);
    }
  }, [safeStudyDuration, safeBreakDuration, isStudyTime, sync]);

  // Sincronizza il timer leggendo i dati in tempo reale da Firestore se in modalità sincronizzata
  useEffect(() => {
    if (!sync || !sessionId) return;
    const sessionRef = doc(db, "globalSessions", sessionId);
    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      const data = docSnap.data();
      if (!data) return;
      const { isRunning, startTime, isStudyTime: remoteIsStudyTime, remainingSeconds } = data;
      setIsStudyTime(remoteIsStudyTime);
      const now = Date.now();
      const baseDuration = remoteIsStudyTime ? safeStudyDuration : safeBreakDuration;
      const newTime = isRunning
        ? Math.max(baseDuration - Math.floor((now - startTime) / 1000), 0)
        : remainingSeconds;
      setIsRunning(isRunning);
      setSecondsLeft(newTime);
    });
    return () => unsubscribe(); // Pulizia in caso il componente venga smontato
  }, [sync, sessionId, safeStudyDuration, safeBreakDuration]);

  // Reset automatico del timer quando termina e non è in esecuzione (solo in modalità sincronizzata)
  useEffect(() => {
    if (sync && !isRunning && secondsLeft === 0) {
      const newDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
      setSecondsLeft(newDuration);
    }
  }, [safeStudyDuration, safeBreakDuration, isStudyTime, sync, isRunning, secondsLeft]);

  // Riproduce i suoni di pre-avviso se il timer sta per terminare
  useEffect(() => {
    if (secondsLeft <= 30 && secondsLeft > 0 && !hasPlayedSoonAudio.current) {
      if (isStudyTime && pauseSoonAudioRef.current) {
        pauseSoonAudioRef.current.play();
      }
      if (!isStudyTime && studySoonAudioRef.current) {
        studySoonAudioRef.current.play();
      }
      hasPlayedSoonAudio.current = true;
    }

    if (secondsLeft > 30) {
      hasPlayedSoonAudio.current = false; // Reset se il timer aumenta di nuovo
    }
  }, [secondsLeft, isStudyTime]);

  // Gestisce l'avanzamento del timer ogni secondo e gestisce i passaggi tra studio e pausa
  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    lastSessionStart.current = Date.now();
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);

          saveStudyIfNeeded();

          const nextIsStudyTime = !isStudyTime;
          const nextDuration = nextIsStudyTime ? safeStudyDuration : safeBreakDuration;

          if (canControl) {
            if (isStudyTime && studyAudioRef.current) studyAudioRef.current.play();
            if (!isStudyTime && breakAudioRef.current) breakAudioRef.current.play();
          }

          if (sync && sessionId && canControl) {
            const sessionRef = doc(db, "globalSessions", sessionId);
            updateDoc(sessionRef, {
              isStudyTime: nextIsStudyTime,
              startTime: Date.now(),
              remainingSeconds: nextDuration,
            });
          }

          setIsStudyTime(nextIsStudyTime);
          setSecondsLeft(nextDuration);
          return nextDuration;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current); // Pulizia al termine
  }, [isRunning, isStudyTime, sync, sessionId, canControl, safeStudyDuration, safeBreakDuration]);

  // Avvia o mette in pausa il timer
  const handleStartPause = async () => {
    if (!canControl) return;
    const totalDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;

    if (sync && sessionId) {
      const sessionRef = doc(db, "globalSessions", sessionId);
      if (!isRunning) {
        await updateDoc(sessionRef, {
          isRunning: true,
          startTime: Date.now() - (totalDuration - secondsLeft) * 1000,
        });
      } else {
        await saveStudyIfNeeded();
        await updateDoc(sessionRef, {
          isRunning: false,
          remainingSeconds: secondsLeft,
        });
      }
    } else {
      if (isRunning) {
        await saveStudyIfNeeded();
      }
      setIsRunning((prev) => !prev);
    }
  };

  // Resetta il timer e la sessione
  const handleReset = async () => {
    if (!canControl) return;

    await saveStudyIfNeeded();

    if (sync && sessionId) {
      const sessionRef = doc(db, "globalSessions", sessionId);
      await updateDoc(sessionRef, {
        isRunning: false,
        isStudyTime: true,
        startTime: Date.now(),
        remainingSeconds: safeStudyDuration,
      });
    } else {
      setIsRunning(false);
      setIsStudyTime(true);
      setSecondsLeft(safeStudyDuration);
    }
  };

  // Converte i secondi in formato HH:MM:SS per la visualizzazione
  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Calcola la percentuale di completamento per eventuali barre di avanzamento
  const totalDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
  const percentComplete = totalDuration > 0 ? 100 - (secondsLeft / totalDuration) * 100 : 0;

  // Garantisce che secondsLeft sia sempre un numero valido e non negativo
  const safeSecondsLeft = typeof secondsLeft === "number" && !isNaN(secondsLeft) && secondsLeft >= 0
    ? secondsLeft
    : 0;

  return (
    <div className="text-center max-w-xl mx-auto">
      <div className="mb-2">
        <span className="text-2xl font-semibold text-purple-400">
          {isStudyTime ? "Studio" : "Pausa"}
        </span>
      </div>

      <div className="text-7xl md:text-8xl font-mono text-white mb-4">
        {formatTime(safeSecondsLeft)}
      </div>

      <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden mb-6">
        <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${percentComplete}%` }} />
      </div>

      <div className="flex justify-center gap-6">
        <button
          onClick={handleStartPause}
          disabled={!canControl}
          className={`px-8 py-4 text-xl rounded-full shadow-lg transition-colors ${canControl ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`}
        >
          {isRunning ? "Pausa" : "Avvia"}
        </button>
        <button
          onClick={handleReset}
          disabled={!canControl}
          className={`px-8 py-4 text-xl rounded-full shadow-lg transition-colors ${canControl ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`}
        >
          Reset
        </button>
      </div>

      {/* Audio Elements */}
      <audio ref={studyAudioRef} src="/audio/study_start.mp3" preload="auto" />
      <audio ref={breakAudioRef} src="/audio/break_start.mp3" preload="auto" />
      <audio ref={pauseSoonAudioRef} src="/audio/pause_soon.mp3" preload="auto" />
      <audio ref={studySoonAudioRef} src="/audio/study_soon.mp3" preload="auto" />
    </div>
  );
}

export default StudyBreakTimer;