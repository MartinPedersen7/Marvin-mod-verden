# Marvin mod verden - v5.3 komplet fix

Clean GitHub Pages-version uden service worker/PWA-cache.

## Rettelser i v5.3

- Wave starter korrekt på Wave 1.
- Ekstra boss-intro efter Kimi-Kaze er blokeret.
- Flow efter boss 2 er låst, så spillet kan fortsætte til bane 3.
- Boss-defeat transition er beskyttet, så samme boss ikke kan starte igen imens opgraderingsmenuen venter.
- Gormi-Zilla spawner ikke længere ekstra almindelige bolde midt i bosskampen.
- Nye 96x96 RGBA-bolde med gennemsigtig baggrund.
- index.html loader game.js?v=5-2.

## Upload

Læg alle filer fra denne mappe direkte i roden af repoet.
Slet fortsat service-worker.js og manifest.json, hvis de ligger der.

Efter push kan du åbne clear-cache.html én gang.


## v5.3 rettelser

- SUPER viser ikke længere tekst-popup.
- Opgraderingsknapper er gjort tydeligere.
- Opgraderinger har større effekt.
- NORMAL og KAOS er gjort tydeligt sværere end NEM.
- Klar til næste trin: Supabase leaderboard i v5.4.
