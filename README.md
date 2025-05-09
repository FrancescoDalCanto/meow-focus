# MeowFocus 😺

**Applicazione web avanzata per la gestione di sessioni di studio individuali e di gruppo con timer Pomodoro, musica LoFi e statistiche di produttività**

---

## Descrizione del progetto

MeowFocus è una piattaforma studiata per supportare studenti e professionisti durante le sessioni di studio o lavoro, favorendo la concentrazione attraverso l'utilizzo del metodo Pomodoro e l'integrazione di musica LoFi. L'applicazione consente sia sessioni personali che collaborative, con timer sincronizzati e statistiche dettagliate sulle attività svolte.

Sviluppata come progetto universitario per il corso di **Sviluppo Applicazioni Web** presso l'Università di Pisa, MeowFocus unisce tecnologie moderne per garantire un'esperienza fluida e interattiva.

---

## Funzionalità principali

### Focus Timer (Pomodoro)
- Timer personalizzabile per studio e pause
- Interfaccia visiva intuitiva con barra di avanzamento e notifiche sonore
- Modalità individuale (pagina **User**)
- Modalità di gruppo con sincronizzazione in tempo reale (pagina **Stanza**)

### Sessioni di gruppo
- Creazione di stanze condivisibili tramite link univoci
- Controllo esclusivo del timer da parte del creatore della stanza (Avvia / Pausa / Reset)
- Timer sincronizzato per tutti i partecipanti autenticati
- Accesso protetto mediante autenticazione

### Musica LoFi
- Player musicale integrato con streaming continuo LoFi (LoFi Girl)
- Controllo diretto dal menu utente e della stanza
- Riproduzione in background tramite embed YouTube

### Statistiche personali
- Storico settimanale delle sessioni completate
- Monitoraggio dei cicli di studio e pausa
- Visualizzazione e confronto mensile tramite grafici intuitivi

---

## Stack tecnologico

- **React** + **Vite** per un'interfaccia moderna e reattiva
- **Firebase**:
  - Autenticazione (Email, Google)
  - Firestore Database per la sincronizzazione in tempo reale
- **Tailwind CSS** per uno stile semplice e rapido
- **Howler.js** per la gestione dei suoni
- **YouTube embed** per l'integrazione musicale

---

## Avvio del progetto in locale

1. Clonare il repository:
    ```bash
    git clone https://github.com/FrancescoDalCanto/-SAW-MeowFocus.git
    cd -SAW-MeowFocus
    ```

2. Installare le dipendenze:
    ```bash
    npm install
    ```

3. Configurare le variabili ambiente creando un file `.env` nella root del progetto e aggiungendo le credenziali Firebase:
    ```env
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=...
    VITE_FIREBASE_STORAGE_BUCKET=...
    VITE_FIREBASE_MESSAGING_SENDER_ID=...
    VITE_FIREBASE_APP_ID=...
    ```

4. Avviare il progetto in modalità sviluppo:
    ```bash
    npm run dev
    ```

---

## Deploy

MeowFocus è ottimizzato per la distribuzione su **Netlify**.

Per garantire il corretto funzionamento delle rotte, creare un file `_redirects` all'interno della cartella `public/` con il seguente contenuto:

```
/*    /index.html   200
```

---

## Informazioni aggiuntive

- I link alle stanze di gruppo seguono il formato `https://meowfocus.netlify.app/session/:id`
- Gli utenti non autenticati vengono reindirizzati alla pagina di login in caso di accesso a stanze protette
- Solo il creatore della stanza ha il controllo completo sul timer
- Le statistiche si aggiornano automaticamente al termine di ogni sessione

---

## Autore

**Francesco Dal Canto**  
Progetto realizzato per il corso **Sviluppo Applicazioni Web** – Università di Pisa

[GitHub](https://github.com/FrancescoDalCanto)