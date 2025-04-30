# MeowFocus 😺
**Applicazione web per la gestione di sessioni di studio singole e di gruppo, con timer Pomodoro, musica LoFi e statistiche di produttività.**

---

## Funzionalità principali

### Focus Timer (Pomodoro)
- Timer personalizzabile per sessioni di studio e pausa
- Interfaccia visiva con progress bar e notifiche sonore
- Studi individuali dalla pagina **User**
- Studi di gruppo dalla pagina **Stanza**

### Sessioni di gruppo
- Crea una stanza condivisibile tramite link univoco
- Solo il creatore della stanza può controllare Avvia / Pausa / Reset
- Timer sincronizzato in tempo reale per tutti i partecipanti
- Accesso riservato agli utenti autenticati

### Musica LoFi
- Player integrato con musica LoFi 24/7 (LoFi Girl)
- Attivabile/disattivabile dal menu sia nella pagina User che nella pagina Stanza
- Riproduzione automatica tramite YouTube nascosto

### Statistiche personali
- Storico delle sessioni completate settimanalmente
- Monitoraggio dei cicli di studio e pause svolte
- Confronto dell'attività mensile tramite grafici

---

## Tecnologie utilizzate

- **React** + **Vite**
- **Firebase**:
  - Autenticazione (Email, Google)
  - Firestore Database (sincronizzazione sessioni)
- **Tailwind CSS** per lo styling rapido
- **Howler.js** per i suoni di fine sessione
- **YouTube embed** per la musica LoFi

---

## Come eseguire il progetto in locale

1. Clona il repository: `git clone https://github.com/FrancescoDalCanto/-SAW-MeowFocus.git` e poi entra nella cartella: `cd -SAW-MeowFocus`
2. Installa le dipendenze: `npm install`
3. Configura le variabili ambiente: crea un file `.env` nella root del progetto e inserisci le tue credenziali Firebase:
   - VITE_FIREBASE_API_KEY=...
   - VITE_FIREBASE_AUTH_DOMAIN=...
   - VITE_FIREBASE_PROJECT_ID=...
   - VITE_FIREBASE_STORAGE_BUCKET=...
   - VITE_FIREBASE_MESSAGING_SENDER_ID=...
   - VITE_FIREBASE_APP_ID=...
4. Avvia il progetto in locale: `npm run dev`

---

## Deploy

Il progetto è ottimizzato per essere distribuito su **Netlify**.  
Assicurati di creare un file `_redirects` nella cartella `public/` con il seguente contenuto:
/*    /index.html   200

---

## Note aggiuntive

- I link delle stanze puntano a `https://meowfocus.netlify.app/session/:id`
- Se un utente apre una stanza senza essere autenticato, viene automaticamente reindirizzato alla pagina di login
- Il controllo del timer nelle sessioni di gruppo è riservato al **creatore** della stanza
- Il sistema di statistiche settimanali e mensili si aggiorna automaticamente ad ogni sessione completata

---

## Autore

**Francesco Dal Canto**  
Progetto sviluppato per il corso **Sviluppo Applicazioni Web** – Università di Pisa  
[GitHub](https://github.com/FrancescoDalCanto)
