import React, { useEffect, useRef, useState } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { updateProgress } from "./updateProgress";

function StudyBreakTimer({ studyDuration, breakDuration, sessionId, sync, canControl }) {
  // Ottiene l'utente autenticato
  const { currentUser } = useAuth();

  // Stati locali per gestire timer e modalità
  const [isStudyTime, setIsStudyTime] = useState(true);  // true = sessione di studio, false = pausa
  const [secondsLeft, setSecondsLeft] = useState(0);     // secondi rimanenti nel timer
  const [isRunning, setIsRunning] = useState(false);     // indica se il timer è attivo (true) o in pausa (false)

  // Riferimenti a intervalli e tempi (persistenti tra render)
  const intervalRef = useRef(null);                     // tiene l'ID del setInterval per poterlo annullare
  const lastSessionStart = useRef(Date.now());          // memorizza l'inizio della sessione per calcolare il tempo effettivo di studio
  const localStartTime = useRef(null);                  // memorizza l'inizio del timer locale (se non sincronizzato)

  // Riferimenti per i suoni di notifica
  const studyAudioRef = useRef(null);                   // audio che avvisa della fine della pausa → inizio studio
  const breakAudioRef = useRef(null);                   // audio che avvisa della fine dello studio → inizio pausa

  // Limite massimo per evitare timer troppo lunghi
  const MAX_DURATION = 86400;
  const safeStudyDuration = Math.min(studyDuration, MAX_DURATION);  // durata studio sicura (max 24h)
  const safeBreakDuration = Math.min(breakDuration, MAX_DURATION);  // durata pausa sicura (max 24h)

  /**
   * Calcola la settimana corrente (anno, numero settimana, giorno della settimana)
   * → Serve per registrare correttamente il progresso nel salvataggio dati
   */
  const getCurrentWeekData = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = (now - start) / 86400000;
    const weekNumber = Math.ceil((diff + start.getDay() + 1) / 7);
    const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    return { year: now.getFullYear(), weekNumber, dayIndex };
  };

  /**
   * Salva i minuti di studio trascorsi se necessario
   * → Viene chiamato quando termina una sessione di studio o quando si mette in pausa
   */
  const saveStudyIfNeeded = async () => {
    const elapsedSeconds = Math.floor((Date.now() - lastSessionStart.current) / 1000);
    if (isStudyTime && elapsedSeconds > 0 && currentUser) {
      const { year, weekNumber, dayIndex } = getCurrentWeekData();
      await updateProgress(currentUser.uid, year, weekNumber, dayIndex, Math.round(elapsedSeconds / 60));
    }
  };

  /**
   * Imposta il timer iniziale solo se NON sincronizzato
   * → Quando cambia durata o modalità studio/pausa
   */
  useEffect(() => {
    if (!sync) {
      const newDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
      setSecondsLeft(newDuration);
    }
  }, [safeStudyDuration, safeBreakDuration, isStudyTime, sync]);

  /**
   * Se sincronizzato → ascolta i cambiamenti in Firestore e aggiorna lo stato locale
   */
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

      // Se è in esecuzione, calcola il tempo rimanente in base a quanto tempo è passato da startTime
      const newTime = isRunning
        ? Math.max(baseDuration - Math.floor((now - startTime) / 1000), 0)
        : remainingSeconds;

      setIsRunning(isRunning);
      setSecondsLeft(newTime);
    });

    return () => unsubscribe();
  }, [sync, sessionId, safeStudyDuration, safeBreakDuration]);

  /**
   * Quando il timer sincronizzato finisce (secondsLeft === 0) → resetta la durata
   */
  useEffect(() => {
    if (sync && !isRunning && secondsLeft === 0) {
      const newDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
      setSecondsLeft(newDuration);
    }
  }, [safeStudyDuration, safeBreakDuration, isStudyTime, sync, isRunning, secondsLeft]);

  /**
   * Timer principale → decrementa ogni secondo
   * → Comportamento diverso tra locale e sincronizzato
   */
  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    if (!sync) {
      // Timer locale
      if (localStartTime.current === null) {
        localStartTime.current = Date.now();
      }
    } else {
      // Timer sincronizzato
      lastSessionStart.current = Date.now();
    }

    intervalRef.current = setInterval(() => {
      if (!sync) {
        // Timer locale → calcolo manuale del tempo
        const totalDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
        const elapsed = Math.floor((Date.now() - localStartTime.current) / 1000);
        const newSecondsLeft = Math.max(totalDuration - elapsed, 0);

        setSecondsLeft(newSecondsLeft);

        if (newSecondsLeft === 0) {
          clearInterval(intervalRef.current);
          saveStudyIfNeeded();

          const nextIsStudyTime = !isStudyTime;
          const nextDuration = nextIsStudyTime ? safeStudyDuration : safeBreakDuration;

          // Suoni di transizione solo se è il creatore (canControl)
          if (canControl) {
            if (isStudyTime && studyAudioRef.current) studyAudioRef.current.play();
            if (!isStudyTime && breakAudioRef.current) breakAudioRef.current.play();
          }

          setIsStudyTime(nextIsStudyTime);
          setSecondsLeft(nextDuration);
          localStartTime.current = null;
        }

      } else {
        // Timer sincronizzato → decrementa direttamente
        setSecondsLeft((prev) => {
          if (prev <= 1) clearInterval(intervalRef.current);
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isStudyTime, sync, sessionId, canControl, safeStudyDuration, safeBreakDuration, secondsLeft]);

  /**
   * Gestisce avvio/pausa timer
   * → Comportamento differente se sync o locale
   */
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
        localStartTime.current = null;
      }
      setIsRunning((prev) => !prev);
    }
  };

  /**
   * Resetta il timer
   * → Riporta tutto allo stato iniziale (studio + timer resettato)
   */
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

  /**
   * Formatta i secondi rimanenti → hh:mm:ss
   */
  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Calcola la percentuale completata della sessione corrente
  const totalDuration = isStudyTime ? safeStudyDuration : safeBreakDuration;
  const percentComplete = totalDuration > 0 ? 100 - (secondsLeft / totalDuration) * 100 : 0;

  // Protegge da numeri negativi per evitare problemi
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