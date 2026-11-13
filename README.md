# Eventora - Modules 5, 9 and 10 (plain HTML pages)

| # | Module | Page URL | Colour |
|---|--------|----------|--------|
| 5 | Free Event Planning Consultation | `/consultation` | Gradient |
| 9 | Ora, the AI chatbot | `/ora` (+ floating button on every page) | Gradient |
| 10 | Invites & Websites | `/invites`, public site `/e/:slug` | Pink |

Pages are plain `.html` files. Node/Express + MongoDB only serve them and provide a small JSON API; a short script on each page fills in the results (plan, invite, chat). Built for Indian events (₹, Indian mobile validation, haldi/mehendi/sangeet, Griha Pravesh, Godh Bharai, Namkaran, festivals).

## Run it alone
```
npm install
copy .env.example .env     (PowerShell / Windows)
npm run dev                (or: npm start)   ->  http://localhost:3000
npm run seed               (optional: add sample records to MongoDB)
```
MongoDB must be reachable before starting the app or running the seed command. The seed command is safe to rerun: it adds sample records once and does not overwrite existing records. Ora works without an API key (rule-based fallback). With `ANTHROPIC_API_KEY` set, it tries Claude first and falls back to rules on any error.

## Your files (safe to merge)
```
pages/      consultation.html  consultation-plan.html  consultation-book.html
            ora.html  invites.html  invites-view.html  event.html
public/js/  consultation.js  ora.js  invites.js
public/css/ consultation.css  ora.css  invites.css
routes/     consultation.js  ora.js  invites.js  eventSite.js
controllers/ consultationController.js  oraController.js  invitesController.js  eventSiteController.js
models/     ConsultationPlan.js  ConsultantRequest.js  ChatMessage.js  Invite.js
data/       indianEventTemplates.js  oraRules.js  inviteTemplates.js
```

## Shared files (keep your teammates' versions when merging)
`app.js`, `routes/index.js`, `pages/home.html`, `public/css/theme.css`, `package.json`.
Add only:
1. In `routes/index.js`: the 4 route lines for your modules.
2. In `public/css/theme.css`: the `[hidden]{display:none!important}` and `.sr-only` rules if missing.
3. In `package.json`: make sure `multer` is listed.

## Ora on every page (plain HTML has no includes)
Each teammate pastes the "ORA FLOATING CHAT" block (marked with a comment in any of my pages) just before `</body>`, plus:
```
<link rel="stylesheet" href="/css/ora.css">   (in <head>)
<script src="/js/ora.js"></script>            (before </body>)
```
The same applies to the top bar and footer: copy the marked "SHARED TOP BAR" block into every page.

## Integration points (agree field names with teammates)
- Checklist: consultation reads `mongoose.models.Task` and inserts `{ title, category, priority, user, notes }`.
- Guests: invite sending and the event-site RSVP use `mongoose.models.Guest`. Search for "ADJUST" in `invitesController.js` and `eventSiteController.js`.
- Venues/Budget: consultation only links to `/venues?...` and `/budget`.
- Login: controllers use `req.session.userId` when it exists. Nothing breaks before login is merged.

## Git steps
```
git checkout main && git pull
git checkout -b feature/modules-5-9-10-<yourname>
git add . && git commit -m "Add consultation, Ora and invites modules"
git pull origin main
git push -u origin feature/modules-5-9-10-<yourname>
```
Never commit `.env`.
