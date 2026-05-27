# Backend comunicazioni

Un piccolo server per **inviare comunicazioni agli utenti della tua app**.
L'admin scrive le comunicazioni da una pagina protetta da codice; gli utenti le leggono.

## Cosa contiene

- `server.js` — il backend (Node.js + Express)
- `public/admin.html` — pagina per **inviare** comunicazioni (chiede il codice)
- `public/index.html` — pagina per gli **utenti** che leggono le comunicazioni
- `.env.example` — esempio di configurazione

## Come avviarlo (Windows)

1. Installa [Node.js](https://nodejs.org) (versione LTS).
2. Apri PowerShell in questa cartella ed esegui:

   ```powershell
   npm install
   Copy-Item .env.example .env
   npm start
   ```

3. Apri il browser:
   - Pannello admin: http://localhost:3000/admin.html
   - Vista utenti:   http://localhost:3000/index.html

## Configurazione importante

Apri il file `.env` e **cambia `ADMIN_CODE`**. Il default `2317` è troppo corto
e facile da indovinare: chiunque potrebbe inviare comunicazioni. Usa una stringa
lunga e casuale (20+ caratteri).

```
ADMIN_CODE=una-frase-lunga-e-difficile-da-indovinare
```

## Come funziona la sicurezza

- Il codice **non** è controllato solo nel browser: viene mandato al server
  (header `X-Admin-Code`) e validato lì. Modificare il JavaScript della pagina
  non basta per bypassare il controllo.
- Resta comunque vero che il codice protegge solo l'invio. Per un uso reale:
  - metti il server dietro **HTTPS** (es. con un reverse proxy o un hosting che lo fornisce),
    altrimenti il codice viaggia in chiaro;
  - cambia ADMIN_CODE come scritto sopra.

## Collegare l'app vera

La vista utenti chiama `GET /api/communications`. Per mostrare le comunicazioni
**dentro l'app Cordova** esistente puoi:

- aprire `index.html` in una `InAppBrowser`, **oppure**
- chiamare `GET <indirizzo-server>/api/communications` da una pagina dell'app e
  mostrare la lista.

Nota: la logica dell'app famiglia è in `dist/main.min.js` (bundle compilato, senza
sorgenti), quindi integrare la lista nella navigazione esistente è limitato senza
il progetto originale. La pagina `index.html` qui inclusa funziona già da sola.

## API

| Metodo | Endpoint | Auth | Descrizione |
|---|---|---|---|
| GET | `/api/communications` | no | Elenco comunicazioni (più recenti prima) |
| POST | `/api/communications` | `X-Admin-Code` | Crea una comunicazione `{title, body}` |
| DELETE | `/api/communications/:id` | `X-Admin-Code` | Elimina una comunicazione |
| POST | `/api/admin/check` | `X-Admin-Code` | Verifica il codice (usato dal pannello) |
