import React, { useEffect, useRef, useState } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { updateProgress } from "./updateProgress";

function StudyBreakTimer({ studyDuration, breakDuration, sessionId, sync, canControl }) {
  const { currentUser } = useAuth();
  const [isStudyTime, setIsStudyTime] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const lastSessionStart = useRef(Date.now());
  const localStartTime = useRef(null); // ← gestisce il tempo di partenza locale

  // Audio refs
  const studyAudioRef = useRef(null);
  const breakAudioRef = useRef(null);
  const pauseSoonAudioRef = useRef(null);
  const studySoonAudioRef = useRef(null);
  const hasPlayedSoonAudio = useRef(false);

  const MAX_DURATION = 86400;
  const safeStudyDuration = Math.min(studyDuration, MAX_DURATION);
  const safeBreakDuration = Math.min(breakDuration, MAX_DURATION);

  // Calcola settimana corrente per aggiornare lo studio
  const getCurrentWeekData = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = (now - start) / 86400000;
    const weekNumber = Math.ceil((diff + start.getDay() + 1) / 7);
    const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    return { year: now.getFullYear(), weekNumber, dayIndex };
  };

  // Salva minuti di studio se necessario
  const saveStudyIfNeeded = async () => {
    const elapsedSeconds = Math.floor((Date.now() - lastSessionStart.current) / 1000);
    if (isStudyTime && elapsedSeconds > 0 && currentUser) {
      const { year, weekNumber, dayIndex } = getCurrentWeekData();
      await updateProgress(currentUser.uid, year, weekNumber, dayIndex, Math.round(elapsedSeconds / 60));
    }
  };

  // Imposta il timer iniziale (solo in locale)
  useEffect(() => {
    if (!sync) {
      const newDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
      setSecondsLeft(newDuration);
    }
  }, [safeStudyDuration, safeBreakDuration, isStudyTime, sync]);

  // Sincronizza con Firestore (se sync è attivo)
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

  // Resetta il timer (sync) se il tempo è 0
  useEffect(() => {
    if (sync && !isRunning && secondsLeft === 0) {
      const newDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
      setSecondsLeft(newDuration);
    }
  }, [safeStudyDuration, safeBreakDuration, isStudyTime, sync, isRunning, secondsLeft]);

  // Audio "sta per finire"
  useEffect(() => {
    if (secondsLeft <= 30 && secondsLeft > 0 && !hasPlayedSoonAudio.current) {
      if (isStudyTime && pauseSoonAudioRef.current) pauseSoonAudioRef.current.play();
      if (!isStudyTime && studySoonAudioRef.current) studySoonAudioRef.current.play();
      hasPlayedSoonAudio.current = true;
    }
    if (secondsLeft > 30) {
      hasPlayedSoonAudio.current = false;
    }
  }, [secondsLeft, isStudyTime]);

  // Timer principale
  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    if (!sync) {
      // Locale → se riparte da una pausa, localStartTime parte da ora
      if (localStartTime.current === null) {
        localStartTime.current = Date.now();
      }
    } else {
      lastSessionStart.current = Date.now();
    }

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

          if (canControl) {
            if (isStudyTime && studyAudioRef.current) studyAudioRef.current.play();
            if (!isStudyTime && breakAudioRef.current) breakAudioRef.current.play();
          }

          setIsStudyTime(nextIsStudyTime);
          setSecondsLeft(nextDuration);
          localStartTime.current = null;
        }

      } else {
        // Sync → classico decremento
        setSecondsLeft((prev) => {
          if (prev <= 1) clearInterval(intervalRef.current);
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isStudyTime, sync, sessionId, canControl, safeStudyDuration, safeBreakDuration, secondsLeft]);

  // Start / Pausa
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
        localStartTime.current = null; // ← in pausa → stoppa il conteggio del tempo
      }
      setIsRunning((prev) => !prev);
    }
  };

  // Reset
  const handleReset = async () => {
    if (!canControl) return;

    await saveStudyIfNeeded();
    localStartTime.current = null; // ← azzera partenza locale

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

  // Format tempo
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
      <audio ref={pauseSoonAudioRef} src="/audio/pause_soon.mp3" preload="auto" />
      <audio ref={studySoonAudioRef} src="/audio/study_soon.mp3" preload="auto" />
    </div>
  );
}

export default StudyBreakTimer;