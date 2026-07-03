# Marvin mod verden - Clean GitHub Pages version

Dette er en ren GitHub Pages-version uden aktiv PWA/service worker.

## Filer der skal ligge i roden

- `index.html`
- `style.css`
- `game.js`
- `README.md`
- `clear-cache.html`
- `.nojekyll`
- `assets/`

## Vigtigt ved upload til GitHub

Slet disse filer fra repoet, hvis de stadig findes fra tidligere versioner:

- `service-worker.js`
- `manifest.json`
- `.github/workflows/static.yml` hvis du ikke vil bruge GitHub Actions manuelt

GitHub Pages kan fortsat stå til:

- Source: Deploy from a branch
- Branch: main
- Folder: /root

## Efter push

Besøg denne side én gang for at rydde gammel service worker/cache:

`https://martinpedersen7.github.io/Marvin-mod-verden/clear-cache.html`

Derefter spil via:

`https://martinpedersen7.github.io/Marvin-mod-verden/`
