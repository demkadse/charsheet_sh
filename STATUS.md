# Status

Stand: 2026-10-19

## Ziel und Umfang

Die Website wird für Desktopfenster ab 1024 Pixeln Breite gestaltet. Der linke Lesebereich bündelt Charaktername, Einleitung, Kapitelnavigation und Geschichte an einer gemeinsamen Kante; rechts bleibt Platz für die Bildmotive. Eine eigene Handyansicht gehört nicht zum Umfang.

## Umgesetzt

- Kapitelnavigation über dem Text, zusammenhängende abgedunkelte Lesezone und kompakte Musiksteuerung.
- Galerie und Hinweise im normalen Seitenfluss, damit sie den Lesetext nicht überlagern.
- Freiwilliger Musikstart ohne vorgeschalteten Dialog; die Audiodatei wird erst beim Start geladen.
- Kapitelwechsel berücksichtigen Direktlinks, Hashänderungen und den Browserverlauf. Veraltete Bildladevorgänge werden bei schnellen Kapitelwechseln nicht mehr übernommen.
- Geschachtelte Galerie- und Bilddialoge verwalten den Tastaturfokus einschließlich Rückkehr zum auslösenden Galeriebild.
- Gemeinsame HTML-Vorlage und Seitengenerator für sechs Charakterseiten. Die 16 veröffentlichten Kapitel stehen bereits im HTML und sind ohne JavaScript lesbar; Brixxli bleibt eine vorbereitete, unveröffentlichte Seite.
- Optimierte Bild- und Schriftdateien mit Manifest und Integritätsprüfung. Die ursprünglichen Textdaten und die vorgefundenen Originalbilder bleiben erhalten; bereits vorhandene Bildänderungen wurden nicht zurückgesetzt.

Die optimierten Bild- und Schriftdateien umfassen im aktuellen Stand einschließlich Vorschaubildern rund 4,54 MB gegenüber rund 59,44 MB Originaldateien, etwa 92 % weniger. Das ist ein Vergleich des Assetbestands, keine Messung des Downloads einer einzelnen Seite.

Beim lokalen Startseitenabruf mit leerem Cache wurden 1.173.665 Bytes übertragen, rund 1,17 MB gegenüber zuvor etwa 18,4 MB. Dieser Seitenabruf ist getrennt vom gesamten Assetbestand zu betrachten.

## Prüfstatus

- `python -B -m unittest discover -s tests -v`: 11 von 11 Tests bestanden, Laufzeit 7,128 Sekunden; keine JavaScript-Laufzeitfehler im Browser.
- Automatisiert geprüft: Generierung ohne Überschreiben der Seiten, sämtliche veröffentlichten Kapitel ohne JavaScript, Startseite ohne JavaScript, Brixxli-Hinweise, lokale Assets, Kapiteladressen und Browserverlauf, Dialogfokus, verzögertes Laden von Audio und Galeriebildern sowie Bildladefehler und konkurrierende Bildwechsel. Die Desktopprüfung umfasst fünf veröffentlichte Charaktere bei jeweils vier Fensterbreiten.
- Visuell geprüft: Aeva bei 1024, 1280, 1440 und 1920 Pixeln Breite sowie alle fünf veröffentlichten Charaktere bei 1440 Pixeln. Linke Kanten stimmen überein; der Footer bleibt im normalen Seitenfluss.
- Zusätzlich eine reduzierte Layoutfläche von 720 × 450 Pixeln geprüft: kein horizontaler Überlauf. Diese Prüfung bildet die verringerte Layoutfläche bei 200 % Zoom nach, ersetzt aber keine Messung mit tatsächlich eingestelltem Browserzoom.
- Abschließendes Review: Freigabe ohne kritische oder wichtige Befunde.

Es wurden kein Commit, Push oder Deployment beauftragt.

## Pflege

Lokaler Start, Datenquellen sowie Befehle zur Seiten- und Asseterzeugung stehen in [README.md](README.md). Generierte Charakterseiten ausschließlich über die gemeinsame Vorlage und die Charakterdaten aktualisieren.
