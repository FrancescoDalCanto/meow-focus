import React, { useEffect, useRef, useState } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { updateProgress } from "./updateProgress";

function StudyBreakTimer({ studyDuration, breakDuration, sessionId, sync, canControl }) {
  const { currentUser } = useAuth();

  const [isStudyTime, setIsStudyTime] = useState(true);    // true = studio, false = pausa
  const [secondsLeft, setSecondsLeft] = useState(0);       // secondi rimanenti
  const [isRunning, setIsRunning] = useState(false);       // stato del timer (attivo/pausa)

  const intervalRef = useRef(null);                        // ID intervallo per fermare il timer
  const lastSessionStart = useRef(Date.now());             // inizio sessione → per salvare minuti studio
  const localStartTime = useRef(null);                     // timestamp inizio → per calcolare tempo residuo in modo preciso

  const studyAudioRef = useRef(null);                      // suono inizio studio
  const breakAudioRef = useRef(null);                      // suono inizio pausa

  const MAX_DURATION = 86400; // limite di sicurezza (24 ore)
  const fallbackDuration = 60; // 1 minuto in secondi

  const safeStudyDuration = Math.min(studyDuration > 0 ? studyDuration : fallbackDuration, MAX_DURATION);
  const safeBreakDuration = Math.min(breakDuration > 0 ? breakDuration : fallbackDuration, MAX_DURATION);

  // Calcola settimana e giorno corrente → per salvare progressi
  const getCurrentWeekData = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = (now - start) / 86400000;
    const weekNumber = Math.ceil((diff + start.getDay() + 1) / 7);
    const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    return { year: now.getFullYear(), weekNumber, dayIndex };
  };

  // Salva i minuti di studio se necessario
  const saveStudyIfNeeded = async () => {
    const elapsedSeconds = Math.floor((Date.now() - lastSessionStart.current) / 1000);
    if (isStudyTime && elapsedSeconds > 0 && currentUser) {
      const { year, weekNumber, dayIndex } = getCurrentWeekData();
      await updateProgress(currentUser.uid, year, weekNumber, dayIndex, Math.round(elapsedSeconds / 60));
    }
  };

  // Imposta il timer iniziale (solo locale)
  useEffect(() => {
    if (!sync) {
      const newDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
      setSecondsLeft(newDuration);
    }
  }, [safeStudyDuration, safeBreakDuration, isStudyTime, sync]);

  // Ascolta i cambiamenti su Firestore (modalità sincronizzata)
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

    return () => unsubscribe();
  }, [sync, sessionId, safeStudyDuration, safeBreakDuration]);

  // Quando il timer sincronizzato finisce → resetta durata
  useEffect(() => {
    if (sync && !isRunning && secondsLeft === 0) {
      const newDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
      setSecondsLeft(newDuration);
    }
  }, [safeStudyDuration, safeBreakDuration, isStudyTime, sync, isRunning, secondsLeft]);

  // Timer principale → aggiorna ogni secondo basandosi sul clock reale
  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    if (!sync) {
      // Se timer locale → imposta localStartTime se assente
      if (localStartTime.current === null) {
        localStartTime.current = Date.now() - ((isStudyTime ? safeStudyDuration : safeBreakDuration) - secondsLeft) * 1000;
      }
    } else {
      // Se sincronizzato → salva inizio sessione
      lastSessionStart.current = Date.now();
    }

    // Intervallo → aggiorna UI ogni secondo calcolando rispetto a localStartTime (clock reale)
    intervalRef.current = setInterval(() => {
      if (!sync) {
        const totalDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
        const elapsed = Math.floor((Date.now() - localStartTime.current) / 1000);
        const newSecondsLeft = Math.max(totalDuration - elapsed, 0);

        setSecondsLeft(newSecondsLeft);

        if (newSecondsLeft === 0) {
          clearInterval(intervalRef.current);
          saveStudyIfNeeded();

          const nextIsStudyTime = !isStudyTime;
          const nextDuration = nextIsStudyTime ? safeStudyDuration : safeBreakDuration;

          // Suoni
          if (canControl) {
            if (isStudyTime && studyAudioRef.current) studyAudioRef.current.play();
            if (!isStudyTime && breakAudioRef.current) breakAudioRef.current.play();
          }

          setIsStudyTime(nextIsStudyTime);
          setSecondsLeft(nextDuration);
          localStartTime.current = null;
        }
      } else {
        // Timer sincronizzato → decremento normale
        setSecondsLeft((prev) => {
          if (prev <= 1) clearInterval(intervalRef.current);
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isStudyTime, sync, sessionId, canControl, safeStudyDuration, safeBreakDuration, secondsLeft]);

  // Avvia/Pausa → salva stato preciso con clock
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

      // Calcola l'esatto punto da cui ripartire
      localStartTime.current = Date.now() - (totalDuration - secondsLeft) * 1000;

      setIsRunning((prev) => !prev);
    }
  };

  // Reset → riporta tutto all'inizio
  const handleReset = async () => {
    if (!canControl) return;

    await saveStudyIfNeeded();
    localStartTime.current = null;

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

  // Formatta i secondi → hh:mm:ss
  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const totalDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
  const percentComplete = totalDuration > 0 ? 100 - (secondsLeft / totalDuration) * 100 : 0;
  const safeSecondsLeft = Math.max(0, secondsLeft);

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

      <audio ref={studyAudioRef} src="/audio/study_start.mp3" preload="auto" />
      <audio ref={breakAudioRef} src="/audio/break_start.mp3" preload="auto" />
    </div>
  );
}

export default StudyBreakTimer;