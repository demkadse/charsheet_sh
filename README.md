# Charsheet

Statische Website für Charaktergeschichten, Bildergalerien und freiwillige Hintergrundmusik, ohne Framework und ohne Serveranwendung. Die Gestaltung richtet sich an Desktopfenster ab 1024 Pixeln Breite: Texte und Navigation stehen links, damit die überwiegend rechts liegenden Bildmotive frei bleiben. Eine eigene Handyansicht ist nicht vorgesehen.

Die Startseite füllt das Browserfenster mit drei nebeneinanderliegenden Charakterkarten für Aeva, Demetria und Tez’anji. Aeva ist beim Öffnen aufgeklappt; per Maus oder Tastatur wird eine andere Karte aktiv. Jede aktive Karte erhält dieselbe Breite von ungefähr der halben Ansicht und bleibt beim Verlassen mit der Maus geöffnet. Name und Details stehen links unten. Ohne JavaScript bleiben drei direkte Links zu den Geschichten verfügbar.

## Lokal ansehen

`index.html` direkt im Browser öffnen. Alternativ im Projektverzeichnis einen lokalen Server starten:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Danach `http://127.0.0.1:8000` öffnen. Für das reine Ansehen sind keine Installation und kein Build nötig; die erzeugten Seiten und optimierten Assets liegen im Projekt.

## Inhalte und Seiten pflegen

- Charakterdaten einschließlich Kapiteltexten und Verweisen auf Originalbilder: `js/data/characters/*.js`.
- Auswahl auf der Startseite: Charakter-Skripte und Ersatzlinks in `index.html`. Die übrigen Charakterseiten bleiben über ihre Direktlinks erreichbar.
- Gemeinsame Charaktervorlage: `templates/character.html`.
- Gestaltung: `css/styles.css`; Interaktionen: `js/character.js` und `js/landing.js`.
- Generierte Seiten: `characters/*.html`. Diese Dateien nicht direkt pflegen.

Nach Änderungen an Charakterdaten, Katalog oder Vorlage die sieben Charakterseiten mit Node.js neu erzeugen:

```powershell
node scripts/build-pages.mjs
```

Die Kapitel stehen anschließend bereits im HTML. Ohne JavaScript bleiben die veröffentlichten Geschichten vollständig lesbar; mit JavaScript kommen Kapitelwechsel, Galerie, Dialoge und Musik hinzu. Musik wird erst nach einem Klick auf „Musik starten“ geladen.

## Bilder und Schriften optimieren

`scripts/optimize-assets.py` erzeugt WebP-Bilder einschließlich Galerie-Vorschaubildern und WOFF2-Schriften unter `assets/optimized/`. Die Originale unter `assets/characters/` und `assets/fonts/` werden nicht überschrieben. Die Daten verweisen weiterhin auf die Originalbilder; die Website verwendet daraus abgeleitete optimierte Pfade.

Die Python-Abhängigkeiten stehen in `scripts/requirements-assets.txt`. Eine isolierte virtuelle Umgebung verwenden, beispielsweise temporär unter PowerShell:

```powershell
$assetEnv = Join-Path $env:TEMP ("charsheet-assets-" + [guid]::NewGuid().ToString("N"))
python -m venv $assetEnv
$assetPython = Join-Path $assetEnv "Scripts/python.exe"
& $assetPython -m pip install -r scripts/requirements-assets.txt
& $assetPython scripts/optimize-assets.py
& $assetPython scripts/optimize-assets.py --check
```

`--check` schreibt nichts und prüft Dateiliste, Einstellungen, Quell- und Ausgabehashes, Bildformat und Abmessungen sowie die benötigten Schriftzeichen. Nach neuen Texten ebenfalls ausführen, damit die verkleinerten Schriften alle benötigten Zeichen enthalten.

Aktualisierungsreihenfolge: Charakterdaten oder Vorlage ändern → `node scripts/build-pages.mjs` → Assetoptimierung ausführen → Assetoptimierung mit `--check` prüfen → Website im Browser kontrollieren.

## Bedienung prüfen

Die automatisierten Regressionstests benötigen Python 3.12 oder neuer, Node.js 18 oder neuer, Playwright und einen installierten Microsoft Edge. Die Suite startet Edge ohne sichtbares Fenster sowie einen eigenen lokalen HTTP-Server; ein separat gestarteter Server ist nicht nötig. In einer isolierten Python-Umgebung ausführen:

```powershell
python -m pip install -r tests/requirements.txt
python -B -m unittest discover -s tests -v
```

Die Suite prüft unter anderem die generierten Seiten, die Geschichten ohne JavaScript, lokale Assets, Kapitel und Browserverlauf, Dialogfokus, verzögertes Laden von Audio und Galeriebildern sowie konkurrierende Bildwechsel und Desktopbreiten. Für die Charakterauswahl prüft sie außerdem Maus- und Tastaturwechsel, das Beibehalten der letzten Auswahl, echte Linkaufrufe mit Enter, reduzierte Bewegung und geringe Fensterhöhe.

Auf Desktopfenstern insbesondere Kapitelwechsel samt Direktlinks und Zurück/Vorwärts, schnelle Kapitelwechsel, Musikstart und Pause sowie Galerie und Bildansicht per Tastatur prüfen. Nach dem Schließen einer Bildansicht soll der Fokus zum zugehörigen Galeriebild zurückkehren. Auch einen Aufruf ohne JavaScript kontrollieren.

Aktueller Arbeitsstand und Prüfstatus: [STATUS.md](STATUS.md).
