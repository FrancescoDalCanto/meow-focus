import React, { useEffect, useRef, useState } from "react";
import { doc, updateDoc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";

function StudyBreakTimer({ studyDuration, breakDuration, sessionId, sync, canControl }) {
  const { currentUser } = useAuth();
  const [isStudyTime, setIsStudyTime] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const lastSessionStart = useRef(Date.now());
  const studyAudioRef = useRef(null);
  const breakAudioRef = useRef(null);

  const MAX_DURATION = 86400;
  const safeStudyDuration = Math.min(studyDuration, MAX_DURATION);
  const safeBreakDuration = Math.min(breakDuration, MAX_DURATION);

  // Calcola anno, settimana e giorno attuale
  const getCurrentWeekData = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = (now - start) / 86400000;
    const weekNumber = Math.ceil((diff + start.getDay() + 1) / 7);
    const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    return { year: now.getFullYear(), weekNumber, dayIndex };
  };

  // Salva i minuti di studio nel DB
  const updateProgress = async (seconds) => {
    if (!currentUser) return;
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
    window.dispatchEvent(new Event("storage-update"));
  };

  // Imposta i secondi iniziali se non è sincronizzato
  useEffect(() => {
    if (!sync) {
      const newDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
      setSecondsLeft(newDuration);
    }
  }, [safeStudyDuration, safeBreakDuration, isStudyTime, sync]);

  // Listener Firestore in sync
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

  // Resetta i secondi se sono a 0
  useEffect(() => {
    if (sync && !isRunning && secondsLeft === 0) {
      const newDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
      setSecondsLeft(newDuration);
    }
  }, [safeStudyDuration, safeBreakDuration, isStudyTime, sync, isRunning, secondsLeft]);

  // Countdown locale
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
          const elapsedSeconds = Math.floor((Date.now() - lastSessionStart.current) / 1000);

          if (isStudyTime) updateProgress(elapsedSeconds);

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
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isStudyTime, sync, sessionId, canControl, safeStudyDuration, safeBreakDuration]);

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
        await updateDoc(sessionRef, {
          isRunning: false,
          remainingSeconds: secondsLeft,
        });
      }
    } else {
      setIsRunning((prev) => !prev);
    }
  };

  // Reset
  const handleReset = async () => {
    if (!canControl) return;
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

  // Format "HH:MM:SS"
  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const totalDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
  const percentComplete = totalDuration > 0 ? 100 - (secondsLeft / totalDuration) * 100 : 0;
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
    </div>
  );
}

export default StudyBreakTimer;