# Status

Stand: 2026-10-19

## Ziel und Umfang

Die Website wird für Desktopfenster ab 1024 Pixeln Breite gestaltet. Der linke Lesebereich bündelt Charaktername, Einleitung, Kapitelnavigation und Geschichte an einer gemeinsamen Kante; rechts bleibt Platz für die Bildmotive. Eine eigene Handyansicht gehört nicht zum Umfang.

## Umgesetzt

- Vollbildauswahl mit fünf nebeneinander aufklappenden Charakterkarten. Aeva ist nur beim Einstieg aktiv; anschließend bestimmen Maus oder Tastatur die Auswahl, die beim Verlassen erhalten bleibt. Alle Figuren erhalten dieselbe aktive Breite von ungefähr der halben Ansicht.
- Die Auswahl zeigt jeden Namen einmal und die Details links unten, mit feiner Akzentkante und individuellen Bildausschnitten. Die sichtbare große Überschrift und der zusätzliche Seitenbildhintergrund entfallen; die Hauptüberschrift für Screenreader und fünf Ersatzlinks ohne JavaScript bleiben erhalten.
- Das vom Nutzer ersetzte Auswahlbild `tezanji_sel.png` bleibt unverändert; seine optimierten WebP-Dateien einschließlich Vorschaubild und Manifest wurden aktualisiert. Die Charakterseiten bleiben gegenüber dem vorigen Stand unverändert.
- Kapitelnavigation über dem Text, zusammenhängende abgedunkelte Lesezone und kompakte Musiksteuerung.
- Galerie und Hinweise im normalen Seitenfluss, damit sie den Lesetext nicht überlagern.
- Freiwilliger Musikstart ohne vorgeschalteten Dialog; die Audiodatei wird erst beim Start geladen.
- Kapitelwechsel berücksichtigen Direktlinks, Hashänderungen und den Browserverlauf. Veraltete Bildladevorgänge werden bei schnellen Kapitelwechseln nicht mehr übernommen.
- Geschachtelte Galerie- und Bilddialoge verwalten den Tastaturfokus einschließlich Rückkehr zum auslösenden Galeriebild.
- Gemeinsame HTML-Vorlage und Seitengenerator für sechs Charakterseiten. Die 16 veröffentlichten Kapitel stehen bereits im HTML und sind ohne JavaScript lesbar; Brixxli bleibt eine vorbereitete, unveröffentlichte Seite.
- Optimierte Bild- und Schriftdateien mit Manifest und Integritätsprüfung. Die ursprünglichen Textdaten und die vorgefundenen Originalbilder bleiben erhalten; bereits vorhandene Bildänderungen wurden nicht zurückgesetzt.

Die optimierten Bild- und Schriftdateien umfassen im aktuellen Stand einschließlich Vorschaubildern 4.595.036 Bytes gegenüber 59.608.486 Bytes Originaldateien, etwa 92,3 % weniger. Das ist ein Vergleich des Assetbestands, keine Messung des Downloads einer einzelnen Seite.

Beim lokalen Startseitenabruf mit leerem Cache und 1440 Pixeln Fensterbreite wurden einschließlich HTML 1.230.176 Bytes übertragen, rund 1,23 MB gegenüber zuvor etwa 18,4 MB. Dieser Seitenabruf ist getrennt vom gesamten Assetbestand zu betrachten.

## Prüfstatus

- `python -B -m unittest discover -s tests -v`: 15 von 15 Tests bestanden, Laufzeit 10,918 Sekunden; keine JavaScript-Laufzeitfehler im Browser. Vier neue Tests decken die überarbeitete Auswahl ab.
- Automatisiert geprüft: Generierung ohne Überschreiben der Seiten, sämtliche veröffentlichten Kapitel ohne JavaScript, Startseite ohne JavaScript, Brixxli-Hinweise, lokale Assets, Kapiteladressen und Browserverlauf, Dialogfokus, verzögertes Laden von Audio und Galeriebildern sowie Bildladefehler und konkurrierende Bildwechsel. Die Desktopprüfung umfasst fünf veröffentlichte Charaktere bei jeweils vier Fensterbreiten.
- Auswahl automatisiert geprüft: 25 Hoverzustände für fünf Figuren bei 1024 × 768, 1280 × 720, 1440 × 900, 1920 × 1080 und 2560 × 1080 Pixeln. Zusätzlich Linkaufrufe mit Enter, gemischte Maus- und Tastaturbedienung, Beibehalten der Auswahl, Ersatzlinks ohne JavaScript, reduzierte Bewegung und Scrollbarkeit bei 1024 × 300 Pixeln.
- Auswahl visuell geprüft: alle fünf Karten bei 1024 und 1440 Pixeln Breite sowie Tezanji bei 1280, 1920 und 2560 Pixeln; zusätzlich eine reduzierte Layoutfläche von 720 × 450 Pixeln. Diese Kontrolle ersetzt keine Messung mit tatsächlich eingestelltem Browserzoom.
- Charakterseiten im vorigen Stand visuell geprüft: Aeva bei 1024, 1280, 1440 und 1920 Pixeln Breite sowie alle fünf veröffentlichten Charaktere bei 1440 Pixeln. Linke Kanten stimmen überein; der Footer bleibt im normalen Seitenfluss.
- Assetprüfung mit `--check`: 26 Originaldateien und 48 Derivate einschließlich Schriften erfolgreich geprüft.
- Abschließendes Review: Freigabe ohne kritische oder wichtige Befunde.

Es wurden kein Commit, Push oder Deployment beauftragt.

## Pflege

Lokaler Start, Datenquellen sowie Befehle zur Seiten- und Asseterzeugung stehen in [README.md](README.md). Generierte Charakterseiten ausschließlich über die gemeinsame Vorlage und die Charakterdaten aktualisieren.
