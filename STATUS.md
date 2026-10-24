# Status

Stand: 2026-10-24

## Demetria: Nach der Schlacht

- Fünftes Kapitel „Wenn die Waffen schweigen“ unter dem Anker `#after-battle` ergänzt. Der Text beschreibt nach Nutzervorgabe die Rettung Verwundeter sowie Demetrias Nähe, Trost und leisen Gesang für Sterbende. Die Zahl der begleiteten Kaldorei bleibt näherungsweise bei beinahe Hunderten; eine militärische oder priesterliche Zugehörigkeit und Heilmagie werden nicht ergänzt.
- Die bisherigen vier Kapitel einschließlich der korrigierten Kindheit in Eschental und Darnassus als späterer Wahlheimat sind unverändert. Kapitelwahl, Weiterlink aus dem vierten Kapitel, Kapitelanzahl der Auswahl und Galerie übernehmen das neue Kapitel über die vorhandenen Abläufe. Demetria hat fünf Kapitel; insgesamt stehen 20 veröffentlichte Kapitel in sieben erzeugten Charakterseiten.
- Das neue Original `assets/characters/demetria/gallery/demetria_faith.png` bleibt unverändert. Die vorhandene Optimierung erzeugte ausschließlich seine WebP-Hintergrundvariante und Galerie-Vorschau; Schriften und übrige Derivate blieben unverändert. Aktueller Bestand ohne Audio: 72.923.150 Bytes Originalbilder und -schriften, 6.039.194 Bytes Derivate (91,7 % kleiner), 32 Originale und 60 Derivate.
- Prüfung: `python -B -m unittest discover -s tests -v` mit 18 von 18 bestandenen Tests (12,445 Sekunden); JavaScript-Syntax, zweimalige deterministische Seitengenerierung, vollständige Assetprüfung mit `--check` und `git diff --check` erfolgreich. SHA-256-Vergleich bestätigt unveränderte Originalbilder, Audio und Originalschriften. Der Datenvergleich bestätigt ausschließlich das zusätzliche Kapitel; der erzeugte Weiterlink führt vom vierten Kapitel zum neuen Abschnitt.
- Zusätzliche Browserprüfung: Weiterlink aus Kapitel 4 und Direktlink `#after-battle` funktionieren; Auswahl und Galerie zeigen jeweils fünf Kapitel beziehungsweise Bilder, einschließlich dekodierbarer Großansicht des neuen Originals. Ohne JavaScript bleiben alle fünf Kapitel lesbar. Das neue Motiv und die Lesbarkeit wurden bei 1024, 1440 und 1920 Pixeln visuell geprüft; keine HTTP- oder JavaScript-Fehler.
- Änderungen liegen lokal vor; kein Commit, Push oder Deployment ausgeführt.

## Demetria: Lore-Korrektur des Prologs

- Kindheit und Jugend liegen nun in Eschental; Darnassus bleibt ihre spätere Wahlheimat. Nur der zweite und dritte Prologabsatz wurden angepasst, die Charakterseite daraus neu erzeugt. Demetria bleibt eine Kriegerin ihres Volkes; ihre konkrete militärische Zugehörigkeit bleibt bis zur Bestätigung durch das Schattenhain-Loreteam offen. Alle übrigen Charaktertexte, Bilder und die Seitengestaltung bleiben unverändert.
- Grundlage: [Schattenhain-Zeitrechnung](https://wiki.schattenhain.de/Timeline), [Darnassus nach dem Dritten Krieg](https://wiki.schattenhain.de/Nachtelfen), [frühe Heimat der Nachtelfen in Kalimdor](https://wiki.schattenhain.de/Geburtsorte_der_Rassen) und [Teldrassils Brand im Jahr 45](https://wiki.schattenhain.de/Geschichte_Lichthafen). Der historische Stand im Geburtsorte-Artikel wird nicht als aktuelles Serverjahr verwendet. Alter 351 und Gegenwart im Jahr 52 sind Nutzervorgaben; daraus folgt rechnerisch das Geburtsjahr -299. Eine Teilnahme an Hyjal oder weitere persönliche Ereignisse wurden nicht ergänzt.
- Prüfung: alle 18 Regressionstests bestanden (16,487 Sekunden); JavaScript-Syntax, zweimalige deterministische Seitenerzeugung, Assetprüfung mit `--check` und `git diff --check` erfolgreich. Der Datenvergleich bestätigt ausschließlich zwei geänderte Prologabsätze; HTML-Struktur und Attribute sind identisch. Keine Bild- oder Schriftdatei wurde neu erzeugt.

## Demetria: Auswahlbild und Prolog

- Demetrias Auswahl verwendet das neue Porträt `assets/characters/demetria/gallery/demetria_sel.png`; der Prolog behält `demetria_prolog.png`. Der Alternativtext beschreibt das Auswahlmotiv mit Bogen im mondbeschienenen Wald. Die generierte Charakterseite lädt wieder das gültige Prolog-WebP als ersten Hintergrund, auch ohne JavaScript.
- Ausschließlich Demetrias Bildausschnitte angepasst: Auswahl oben ausgerichtet, damit das Gesicht im Hochformat sichtbar bleibt; die Prolog-Galerievorschau zeigt den rechten Motivbereich. Vier WebP-Dateien einschließlich zweier neuer Auswahlbild-Derivate und das Manifest aktualisiert. Nutzertexte sowie Originalbilder, Audio- und Schriftdateien blieben unverändert.
- Aktueller Bild- und Schriftbestand ohne Audio: 70.928.460 Bytes Originaldateien, 5.850.900 Bytes optimierte Derivate. `--check` und die unabhängige Hashprüfung bestätigen 31 Originaldateien und 58 Derivate. Alle 81 Bildreferenzen und sämtliche Audiopfade sind vorhanden; die sieben erzeugten Seiten sind aktuell und deterministisch.
- `python -B -m unittest discover -s tests -v`: alle 18 Tests bestanden (12,889 Sekunden), einschließlich dreier neuer Prüfungen. Die Pfadprüfung erfasst jetzt auch `data-image` und CSS-`url()`; Demetrias getrennte Auswahl- und Prologmotive werden einschließlich Bilddekodierung, Aufruf ohne JavaScript, Galerie und Originalbild geprüft. Die Suite deckt weiterhin sechs veröffentlichte Figuren, 19 Kapitel, sieben Seiten, 30 Auswahlzustände und vier Lesefensterbreiten ab.
- Zusätzlicher Browserrundgang: alle sechs Figuren, 19 Kapitel, 21 Galerieoriginale samt Vorschauen und sechs Musikstücke einschließlich Start, Lautstärke und Pause erfolgreich; keine HTTP- oder JavaScript-Fehler. Demetrias offene und geschlossene Auswahl bei 1024, 1440 und 2560 Pixeln, alle vier Kapitel und die Galerie bei 1440 Pixeln sowie der Prolog bei 1024 Pixeln visuell geprüft.
- Abschließendes Review ohne wichtige Befunde freigegeben. Änderungen liegen lokal vor; kein Commit, Push oder Deployment ausgeführt. Eine neue Messung des Startseitentransfers wurde nicht durchgeführt.

## Vorheriger Stand vom 2026-10-20: Ergänzung Reacher

- Reacher ist als sechste veröffentlichte Figur in die bestehende Charakterauswahl aufgenommen, einschließlich direktem Ersatzlink ohne JavaScript. Brixxli bleibt unveröffentlicht; insgesamt werden sieben Charakterseiten erzeugt.
- Drei Kapitel auf Grundlage der Nutzervorgaben ausgearbeitet: eigenwillige Privatermittlerin mit Hang zur Eigenjustiz, Überleben des Worgenangriffs und des Fluchs sowie wechselnde Ermittlungsorte in den Städten der Allianz. Damit stehen 19 veröffentlichte Kapitel im HTML.
- Die vier gelieferten PNG-Dateien und `Foggy Streets.mp3` wurden unverändert nach `assets/characters/reacher/` übernommen. Auswahlbild, Kapitelhintergründe, Galerievorschauen und freiwillige Musiksteuerung verwenden dieselben Vorlagen und Abläufe wie die übrigen Figuren.
- Individuelle Bildausschnitte halten Reacher im dritten Kapitel rechts vom Lesebereich sichtbar und zeigen ihr Gesicht in den Galerievorschauen. Die Originaldateien wurden dafür nicht bearbeitet.
- Die aktive Auswahlkarte erhält ihre Breite nun anhand der Anzahl veröffentlichter Figuren. Auch mit sechs Karten steht jeder aktiven Figur ungefähr die halbe Fensterbreite zur Verfügung. Die vorhandenen Auswahltests berücksichtigen die Charakterzahl und den Tastaturumlauf automatisch.
- Acht neue WebP-Derivate einschließlich Vorschaubildern erzeugt; die bisherigen Bild- und Schriftderivate blieben unverändert. Die Integritätsprüfung bestätigt 30 Originaldateien und 56 Derivate einschließlich Schriften. Der optimierte Bestand umfasst 5.659.984 Bytes gegenüber 68.885.689 Bytes Originalbildern und -schriften (91,8 % weniger; ohne Audio).
- Abschließende Prüfung: alle 15 Regressionstests bestanden (22,628 Sekunden), einschließlich sechs Figuren bei fünf Auswahl-Fenstergrößen und sechs Charakterseiten bei vier Desktopbreiten. Seitengenerierung ist deterministisch; `--check`, JavaScript-Syntax und `git diff --check` erfolgreich.
- Zusätzliche Browserkontrolle für Reacher: alle drei Kapitelhintergründe, drei Galerieoriginale, tatsächlicher Musikstart, Lautstärkeänderung und Pause erfolgreich; keine HTTP- oder JavaScript-Fehler. Auswahl und Prolog bei 1024 und 1440 Pixeln, zweites Kapitel und Galerie bei 1440 Pixeln sowie der korrigierte dritte Bildausschnitt bei 1024, 1440 und 1920 Pixeln visuell geprüft.
- README aktualisiert. Änderungen liegen lokal vor; kein Commit, Push oder Deployment ausgeführt.

## Vorheriger Stand vom 2026-10-19

## Ziel und Umfang

Die Website wird für Desktopfenster ab 1024 Pixeln Breite gestaltet. Der linke Lesebereich bündelt Charaktername, Einleitung, Kapitelnavigation und Geschichte an einer gemeinsamen Kante; rechts bleibt Platz für die Bildmotive. Eine eigene Handyansicht gehört nicht zum Umfang.

## Umgesetzt

- Der sichtbare Charaktername lautet websiteweit `Tez'anji`, einschließlich Auswahl, Beschreibung, Seitentitel, Alternativtext und sämtlicher Storypassagen. Technische Slugs und Dateipfade bleiben unverändert.
- Vollbildauswahl mit fünf nebeneinander aufklappenden Charakterkarten. Aeva ist nur beim Einstieg aktiv; anschließend bestimmen Maus oder Tastatur die Auswahl, die beim Verlassen erhalten bleibt. Alle Figuren erhalten dieselbe aktive Breite von ungefähr der halben Ansicht.
- Die Auswahl zeigt jeden Namen einmal und die Details links unten, mit feiner Akzentkante und individuellen Bildausschnitten. Die sichtbare große Überschrift und der zusätzliche Seitenbildhintergrund entfallen; die Hauptüberschrift für Screenreader und fünf Ersatzlinks ohne JavaScript bleiben erhalten.
- Die erneut vom Nutzer ersetzten Bilder `tezanji_1.png`, `tezanji_3.png` und `tezanji_sel.png` wurden in die optimierten WebP-Dateien und Galerie-Vorschaubilder übernommen; das Manifest ist aktualisiert. Die Originaldateien blieben bei der Erzeugung nachweislich unverändert, ebenso Code und Bildausschnitte.
- Kapitelnavigation über dem Text, zusammenhängende abgedunkelte Lesezone und kompakte Musiksteuerung.
- Galerie und Hinweise im normalen Seitenfluss, damit sie den Lesetext nicht überlagern.
- Freiwilliger Musikstart ohne vorgeschalteten Dialog; die Audiodatei wird erst beim Start geladen.
- Kapitelwechsel berücksichtigen Direktlinks, Hashänderungen und den Browserverlauf. Veraltete Bildladevorgänge werden bei schnellen Kapitelwechseln nicht mehr übernommen.
- Geschachtelte Galerie- und Bilddialoge verwalten den Tastaturfokus einschließlich Rückkehr zum auslösenden Galeriebild.
- Gemeinsame HTML-Vorlage und Seitengenerator für sechs Charakterseiten. Die 16 veröffentlichten Kapitel stehen bereits im HTML und sind ohne JavaScript lesbar; Brixxli bleibt eine vorbereitete, unveröffentlichte Seite.
- Optimierte Bild- und Schriftdateien mit Manifest und Integritätsprüfung. Die ursprünglichen Textdaten und die vorgefundenen Originalbilder bleiben erhalten; bereits vorhandene Bildänderungen wurden nicht zurückgesetzt.

Die optimierten Bild- und Schriftdateien umfassen im aktuellen Stand einschließlich Vorschaubildern 4.606.200 Bytes gegenüber 60.056.185 Bytes Originaldateien, etwa 92,3 % weniger. Das ist ein Vergleich des Assetbestands, keine Messung des Downloads einer einzelnen Seite.

Beim lokalen Startseitenabruf vor der erneuten Bildaktualisierung wurden mit leerem Cache und 1440 Pixeln Fensterbreite einschließlich HTML 1.230.176 Bytes übertragen, rund 1,23 MB gegenüber zuvor etwa 18,4 MB. Dieser frühere Messwert beschreibt nicht den aktuellen Bildstand und ist getrennt vom gesamten Assetbestand zu betrachten.

## Prüfstatus

- Erneute Bildaktualisierung: Assetoptimierung und vollständige `--check`-Prüfung erfolgreich; SHA-256 aller Originalbilder vor und nach der Erzeugung identisch. Genau sechs Bildderivate und das Manifest wurden neu erzeugt, keine Schriften. Auswahl und betroffene Kapitel bei 1024 und 1440 Pixeln nach abgeschlossener Überblendung visuell geprüft; alle drei Galerievorschaubilder und die Original-Großansicht erfolgreich geladen, keine HTTP- oder JavaScript-Fehler. Die folgenden Regressionstestergebnisse beziehen sich auf die letzte Codeänderung; für den reinen Bildtausch wurde die Suite nicht erneut ausgeführt.
- Namenskorrektur `Tez'anji`: Seitengenerator und JavaScript-Syntaxprüfung erfolgreich; alle 15 Regressionstests in 10,620 Sekunden bestanden. Assetprüfung einschließlich benötigter Schriftzeichen und `git diff --check` erfolgreich; keine alten sichtbaren Namensvorkommen verbleiben.
- `python -B -m unittest discover -s tests -v`: 15 von 15 Tests bestanden, Laufzeit 10,918 Sekunden; keine JavaScript-Laufzeitfehler im Browser. Vier neue Tests decken die überarbeitete Auswahl ab.
- Automatisiert geprüft: Generierung ohne Überschreiben der Seiten, sämtliche veröffentlichten Kapitel ohne JavaScript, Startseite ohne JavaScript, Brixxli-Hinweise, lokale Assets, Kapiteladressen und Browserverlauf, Dialogfokus, verzögertes Laden von Audio und Galeriebildern sowie Bildladefehler und konkurrierende Bildwechsel. Die Desktopprüfung umfasst fünf veröffentlichte Charaktere bei jeweils vier Fensterbreiten.
- Auswahl automatisiert geprüft: 25 Hoverzustände für fünf Figuren bei 1024 × 768, 1280 × 720, 1440 × 900, 1920 × 1080 und 2560 × 1080 Pixeln. Zusätzlich Linkaufrufe mit Enter, gemischte Maus- und Tastaturbedienung, Beibehalten der Auswahl, Ersatzlinks ohne JavaScript, reduzierte Bewegung und Scrollbarkeit bei 1024 × 300 Pixeln.
- Auswahl visuell geprüft: alle fünf Karten bei 1024 und 1440 Pixeln Breite sowie Tez'anji bei 1280, 1920 und 2560 Pixeln; zusätzlich eine reduzierte Layoutfläche von 720 × 450 Pixeln. Diese Kontrolle ersetzt keine Messung mit tatsächlich eingestelltem Browserzoom.
- Charakterseiten im vorigen Stand visuell geprüft: Aeva bei 1024, 1280, 1440 und 1920 Pixeln Breite sowie alle fünf veröffentlichten Charaktere bei 1440 Pixeln. Linke Kanten stimmen überein; der Footer bleibt im normalen Seitenfluss.
- Assetprüfung mit `--check`: 26 Originaldateien und 48 Derivate einschließlich Schriften erfolgreich geprüft.
- Abschließendes Review: Freigabe ohne kritische oder wichtige Befunde.

Es wurden kein Commit, Push oder Deployment beauftragt.

## Pflege

Lokaler Start, Datenquellen sowie Befehle zur Seiten- und Asseterzeugung stehen in [README.md](README.md). Generierte Charakterseiten ausschließlich über die gemeinsame Vorlage und die Charakterdaten aktualisieren.
