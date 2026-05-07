# Dobbel 🎲

Dobbelstenen + Yahtzee-scorekaart voor op het terras. Met telefoon-schudden!

## Deployen naar Vercel

### Stap 1 — Naar GitHub
1. Maak een nieuwe repository aan op github.com (bijv. `dobbel`)
2. Upload alle bestanden uit deze map naar die repo
   - Op desktop: sleep ze in de browser bij "uploading an existing file"
   - Of via git: `git init && git add . && git commit -m "init" && git remote add origin <jouw-repo-url> && git push -u origin main`

### Stap 2 — Naar Vercel
1. Ga naar https://vercel.com/new
2. Kies je nieuwe GitHub-repo
3. Klik **Deploy** (alle defaults zijn goed)
4. Na ~1 minuut krijg je een URL zoals `dobbel-xxx.vercel.app`

### Stap 3 — Op je iPhone
1. Open de URL in **Safari** (niet Chrome — moet Safari zijn voor de sensor)
2. Tik het deel-icoon → **Zet op beginscherm**
3. Open de app via dat icoon
4. Eerste keer: tik op "schudden activeren" → sta toe
5. Schud!

## Lokaal draaien
```bash
npm install
npm run dev
```
