# Marvin mod verden - Version 4

Komplet mobilvenlig browser-spilpakke lavet med HTML, CSS, JavaScript og Phaser.js via CDN.

## Nyt i version 4

- PWA/app-installation via `manifest.json` og `service-worker.js`
- App-ikon med Marvin på græsbane
- Højere/tallere spilleformat: `480 x 1040`, bedre til moderne iPhones
- Multitouch rettet, så man kan styre, skyde og bruge SUPER samtidig
- Separat SUPER-knap
- Tyndere og hurtigere Marvin-laser
- Bedre oprydning af skud/fjender, så gamle prikker ikke bliver hængende
- Forbedrede fodboldfjender
- Gennemsigtige Marvin- og boss-assets uden fast sort baggrund
- Sværhedsgrad: NEM, NORMAL og KAOS
- Førstegangs-tutorial
- Upgrade-valg efter bosskampe
- Score summary og kopier-score-knap
- Lyd ON/OFF

## Filstruktur

```text
index.html
style.css
game.js
manifest.json
service-worker.js
README.md
assets/
```

## Sådan tester du lokalt

1. Åbn mappen i Visual Studio Code.
2. Højreklik på `index.html`.
3. Vælg `Open with Live Server`.

## Sådan udgiver du på GitHub Pages

1. Sørg for at `index.html`, `game.js`, `style.css`, `manifest.json` og `assets/` ligger direkte i repoets rod.
2. Commit og push til `main`.
3. Gå til `Settings -> Pages`.
4. Vælg enten:
   - `Deploy from a branch`, branch `main`, folder `/root`, eller
   - `GitHub Actions` med Static HTML workflow.

## Mobil-installation

Åbn GitHub Pages-linket på mobilen.

### iPhone

Åbn i Safari -> Del -> Føj til hjemmeskærm.

### Android

Åbn i Chrome -> menu med tre prikker -> Føj til startskærm / Installer app.
