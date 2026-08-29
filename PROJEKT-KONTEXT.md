# Arcday (früher "Day Guide") – Projekt-Kontext für Claude Code

Diese Datei fasst zusammen, was Tim und Claude (im Chat) bisher gemeinsam gebaut haben,
damit Claude Code sofort ohne Rückfragen weiterarbeiten kann.

## Was ist das Projekt?

Eine persönliche Tages-Dashboard-App für Tim (Kantonsschüler, Kirchberg SG/Wil).
Reine statische Website (HTML/CSS/JS, kein Framework, kein Backend), gehostet über
GitHub Pages. Live-URL: https://runningbanana-cloud.github.io/day-guide/

Lokaler Ordner auf Tims PC: `Desktop\Arcday Files`
GitHub-Repository heisst weiterhin `day-guide` (nur der Anzeigename/App-Name wurde
zu "Arcday" geändert, Repo/URL nicht umbenannt).

## Dateien

- `index.html` – Struktur + komplettes CSS (inline im `<style>`-Tag)
- `app.js` – alle Logik
- `data.js` – Tims persönliche Daten (Stundenplan, Prüfungen, Fahrpläne etc.), **darf
  und soll Tim selbst bearbeiten**, ist bewusst von app.js/index.html getrennt
- `manifest.json` – PWA-Manifest (Homescreen-Icon)
- `icon-192.png` / `icon-512.png` – App-Icon (Tagbogen mit wanderndem Punkt, siehe unten)

## Design-Prinzipien (wichtig, nicht versehentlich ändern!)

- **Nur Schwarz/Weiss/Grau.** Kein Amber, keine Farben. Alle bisherigen Farbakzente
  wurden auf Wunsch von Tim entfernt.
- **Keine Emojis. Nirgends.** Weder im Code (z. B. als Listensymbole) noch im Chat mit Tim.
- Abgerundete Boxen mit weissem Rand pro Sektion (`.section`), NICHT die ursprüngliche
  Variante mit nur dünnen Trennlinien (das war die allererste Version, wurde bewusst
  geändert).
- Schriften: Fraunces (Serif, für grosse/wichtige Zahlen und Überschriften), Inter
  (Fliesstext), IBM Plex Mono (ungenutzt aktuell, war für Zahlen gedacht, `tabular-nums`
  wird stattdessen global auf `body` gesetzt).

## Architektur-Kern: Tagesphasen

`getTagesPhase()` in app.js ist das Herzstück. Gibt einen String zurück:
- `"wochenende"` – Sa/So, oder wenn Ferienmodus aktiv ist (siehe unten)
- `"vor"` – vor Unterrichtsbeginn
- `"unterricht"` – während der Schule
- `"heimweg"` – ab 10 Min. vor Unterrichtsende (`HEIMWEG_VORLAUF_MIN`), bis
  `HEIMWEG_FENSTER_MIN` (90 Min.) danach
- `"abend"` – nach dem Heimweg-Fenster, bis Mitternacht
- `"keineLektionen"` – Wochentag ohne Stundenplan-Einträge (Fallback)

`applyTimeOfDayLayout(phase)` sortiert/versteckt basierend auf der Phase die
Sektionen im `.wrap`-Container per `wrap.append(...)` (verschiebt DOM-Knoten in der
angegebenen Reihenfolge). Sektionen, die NICHT in einem `append()`-Aufruf für die
aktuelle Phase auftauchen, bleiben unsichtbar (via `style.display = "none"`).

**Ferienmodus:** In den Einstellungen (Menü) umschaltbar, speichert
`localStorage.dayguide_ferienmodus = "1"`, `getTagesPhase()` gibt dann immer
`"wochenende"` zurück, egal was der Wochentag ist. Löst `location.reload()` aus.

## Bus-Logik

- **Etappe 1 (morgens, fix):** Kirchberg Post → Wil Bahnhof, feste Zeiten in
  `ETAPPE1_FAHRPLAN` (data.js), keine Live-Daten nötig. Zeigt Abfahrt→Ankunft
  (Ankunft = Abfahrt + `REISEZEIT_ETAPPE1_MIN`) und "Losfahren spätestens"
  (Abfahrt − `ZEIT_ZUHAUSE_HALTESTELLE_MIN`, aktuell 10 Min., Tim fährt E-Scooter).
- **Etappe 2 (morgens, live):** Wil Bahnhof → Kanti, Linie 733, via
  transport.opendata.ch API. Empfehlung Bus-vs-Laufen nutzt `WARTETOLERANZ_MIN`
  (15 Min. – Tim ist bereit, bis zu 15 Min. auf den Bus zu warten, auch wenn Laufen
  technisch schneller wäre).
- **Heimweg (live):** Kanti → Wil Bahnhof (Linie 733) + Wil Bahnhof → Kirchberg Post
  (Linie 732, **nicht verifiziert**, nur angenommen dieselbe Linie wie morgens).
- Wichtig: Tim möchte **mindestens 10 Min. vor Unterrichtsbeginn** an der Kanti sein –
  das ist bisher NICHT in die Berechnung eingebaut, nur als Hinweis vermerkt. Falls
  das noch gebaut werden soll: mit `STUNDENPLAN` den frühesten Lektionsbeginn des Tages
  finden und die Bus-Empfehlung entsprechend gegenprüfen.

## Wetter

- Open-Meteo API (kein Key), Koordinaten in `WEATHER_LOCATION` (data.js) – aktuell nur
  grob auf Kirchberg SG geschätzt, nicht Tims exakte Adresse.
- Reduziert sich wie News auf nur das Label ("Wetter 18°"), sobald es in diesem
  Zeitfenster (morgen/mittag, siehe `getNewsSlot()`) schon einmal angeschaut wurde.
  Klick auf das Label (`#weather-label`) klappt wieder auf/zu.
- **Regenradar wieder entfernt:** gab es zwischenzeitlich (RainViewer + Leaflet-Karte
  mit Zeitschieberegler), Tim war der Meinung, es funktioniere nicht, und wollte es
  ersatzlos weg. Komplett entfernt inkl. Leaflet-Includes im `<head>`. Falls das Thema
  nochmal aufkommt: einfacher/robuster neu bauen, nicht die alte Version reaktivieren.

## Cache-Busting

`data.js` und `app.js` werden mit `?v=1` eingebunden (in index.html). **Bei JEDEM
Deploy diese Zahl hochzählen** (v=2, v=3, ...), sonst kann es sein, dass Tims iPhone
(als Homescreen-App/PWA installiert) eine alte, gecachte Version der Skripte
weiterverwendet und Änderungen nicht ankommen - ist schon mehrfach passiert und hat zu
verwirrenden "das funktioniert nicht"-Meldungen geführt, obwohl der Code eigentlich
schon lief. Betrifft nur die Skripte, NICHT `index.html` selbst - falls Tim meldet,
dass sich GAR NICHTS aktualisiert (auch keine neuen HTML-Elemente/Menüpunkte
erscheinen), liegt es am gecachten `index.html` selbst, nicht an den Skripten - dagegen
hilft nur: die Homescreen-App entfernen und über Safari neu zur Startseite hinzufügen,
oder in normalem Safari die Website-Daten für die Domain löschen.

## Automatischer Refresh beim Zurückkommen (iOS-PWA-Fix)

Tim (App auf iPhone-Homescreen, also als PWA im "standalone"-Modus): musste bisher
nach jedem Tagesphasen-Wechsel die App manuell schliessen und neu laden, weil iOS die
Seite im Hintergrund einfriert statt sie weiterlaufen zu lassen oder neu zu laden.

**Lösung:** `init()` in app.js ist jetzt in zwei Teile gesplittet:
- `aktualisiereInhalt()` - alles Zeitabhängige (Tagesphase, Wetter, Bus, Stundenplan,
  Prüfungen, News, Erinnerungen, Flämmchen-Anzeige, Hausaufgaben-Widget, Favicon).
  Hängt KEINE Event-Listener an, darf beliebig oft aufgerufen werden.
- `init()` - ruft `aktualisiereInhalt()` einmal auf, dann alle `setup*()`-Funktionen
  (Event-Listener), UND registriert einen `visibilitychange`-Listener, der bei
  Rückkehr in den Vordergrund (`document.visibilityState === "visible"`) erneut
  `aktualisiereInhalt()` aufruft.

**Wichtige Regel für neue Features:** Alles, was nur Inhalt/Anzeige aktualisiert
(kein `addEventListener`), gehört in `aktualisiereInhalt()` (oder eine Funktion, die
von dort aufgerufen wird). Alles, was Event-Listener anhängt, gehört NUR in `init()`
(einmalig) - sonst hängen sich bei jedem Vordergrund-Wechsel doppelte/dreifache
Listener an (z. B. ein Klick auf einen Button würde ein Popup zweimal auf und wieder
zu schalten). Bei Flämmchen wurde dafür extra `aktualisiereFlaemmchenInhalt()` aus
`setupFlaemmchen()` herausgezogen - gutes Vorbild für ähnliche Fälle.

## Bugfix: Menü-Schliessen-Kreuz nicht erreichbar

`.menu-close` war `position: absolute` relativ zu `.menu-panel` - das ist normaler
(scrollender) Inhalt von `.menu-overlay`. In langen Ansichten (z. B. Hausaufgaben-
Formular) wanderte das Kreuz beim Scrollen nach oben aus dem sichtbaren Bereich und
wurde unerreichbar (Tim: "sehr, sehr selten funktioniert's"). Gefixt mit
`position: fixed` (gleiche Koordinaten wie `.icon-reihe`) - bleibt jetzt immer an
derselben Bildschirmstelle, unabhängig vom Scroll-Stand im Menü.

## Notiz-Post-it: nur sichtbar mit Text (nicht mehr immer)

Kurzes Hin und Her hier: Post-it war ursprünglich nur mit Text sichtbar (Icon sonst).
Wurde kurz auf "immer sichtbar, auch leer als Platzhalter" geändert, dann von Tim
wieder zurückgewiesen - er wollte NUR bei vorhandenem Text die grosse Kachel, sonst
nur das kleine Stift-Icon. Jetzt wieder wie ursprünglich (`updatePostit()` blendet bei
leerem Text komplett aus). Die Klick-Funktionalität (Kachel antippen öffnet direkt das
Bearbeiten-Popup) bleibt aber gefixt, siehe Bugfix-Eintrag oben in der Notiz-Sektion.

## Desktop-Layout (ab 900px Breite)

Handy-Ansicht (unter 900px) bleibt komplett unverändert - Tim war damit schon
zufrieden, wollte nur für den PC (mehr Platz) etwas anderes. `@media (min-width: 900px)`
macht aus `.wrap` ein zweispaltiges CSS-Grid (`1.6fr 1fr`, `max-width: 1200px`, damit
der Bildschirm auch auf grossen Monitoren ordentlich gefüllt wird statt schmal in der
Mitte zu kleben - war Tims erste Rückmeldung dazu).

**Spalten-Zuordnung per ID, für BEIDE Spalten explizit** (`#section-xyz { grid-column:
1; }` bzw. `2`), NICHT per DOM-Reihenfolge/"auto" gelassen. **Wichtiger Bugfix hier:**
zuerst war nur Spalte 2 explizit zugewiesen, Spalte-1-Kandidaten liefen auf "auto" -
das führte dazu, dass CSS Grids Auto-Placement-Algorithmus manche "auto"-Boxen (z. B.
Prüfungen) je nach aktueller DOM-Reihenfolge (die `applyTimeOfDayLayout()` per
`wrap.append()` ständig ändert) unvorhersehbar in Spalte 2 einsortiert hat, statt in
Spalte 1 zu bleiben. Regel für neue dauerhafte Sektionen: IMMER explizit `grid-column:
1` ODER `2` setzen, nie eine dritte, unzugewiesene Sektion einfach so im `.wrap` lassen.

Spalte 2 (rechts, schmaler): Notiz-Post-it, Hausaufgaben-Widget, Kalender-Widget,
Flämmchen-Vorschau, News. Spalte 1 (links, breiter): Wetter, Bus, Stundenplan,
Nächste-Lektion, Prüfungen, Morgenroutine, Packliste, Abendroutine,
Hausaufgaben-Erinnerung, Lese-Erinnerung. `.header` spannt beide Spalten oben drüber
(`grid-column: 1/-1; grid-row: 1;`).

**Zweiter Bugfix, gravierender als der erste:** Auch mit `grid-column` für beide
Spalten explizit gesetzt, blieb `grid-row` implizit ("auto") - dadurch hat sich CSS
Grid einen GEMEINSAMEN Zeilen-Cursor über beide Spalten hinweg gemerkt, der sich nach
der DOM-Reihenfolge aller Elemente richtet (nicht pro Spalte einzeln). Da
`applyTimeOfDayLayout()` die DOM-Reihenfolge der Sektionen phasenabhängig per
`wrap.append()` ändert und dabei Spalte-1- und Spalte-2-Elemente munter mischt, sprang
dieser Cursor teils viele Zeilen weiter, bevor er wieder bei Spalte 1 ankam - Ergebnis:
grosse, falsch aussehende Lücken oben in Spalte 1, während Spalte 2 schon oben anfing
(Tim: "komplett unübersichtlich", hat es mit einer roten Kreis-Skizze gezeigt).

**Fix:** `aktualisiereDesktopGridZeilen()` in app.js weist JEDER sichtbaren Sektion
eine explizite `grid-row` zu, pro Spalte unabhängig hochgezählt (`SPALTE_1_IDS`/
`SPALTE_2_IDS`-Listen, Zeile 2 aufwärts, Zeile 1 ist für `.header` reserviert). Damit
verhält sich jede Spalte wie eine eigene, in sich geschlossene Liste - komplett
unabhängig von der DOM-Reihenfolge/der anderen Spalte. Wird am Ende von
`aktualisiereInhalt()` aufgerufen, NACH allen Funktionen, die Sektionen ein-/ausblenden
(sonst wären die `display:none`-Prüfungen veraltet). **Bei neuen dauerhaften
Sektionen im Desktop-Grid: IMMER auch in `SPALTE_1_IDS` oder `SPALTE_2_IDS` in app.js
eintragen**, sonst bekommt die Sektion nie eine `grid-row` und das Problem kann in
abgeschwächter Form wieder auftreten.

**Resize-Listener:** ein (leicht entprellter) `window.addEventListener("resize", ...)`
ruft `aktualisiereDesktopGridZeilen()` erneut auf - ohne den blieben die grid-row-Werte
stehen, wenn jemand das Browserfenster live über die 900px-Grenze zieht (beim Testen
aufgefallen: Seite in einem schmalen Tab laden lassen und danach in der Vorschau auf
Desktop-Breite vergrössern reproduziert das Problem zuverlässig).

**Spalten-Reihenfolge:** `SPALTE_2_IDS` hat Flämmchen-Vorschau und News VOR dem
Kalender-Widget (nicht danach) - Tim wollte die beiden kleineren Kacheln oben, den
(grossen) Kalender unten. Kam über eine rot eingekreiste Screenshot-Skizze rüber, kein
Text nötig gewesen.

**Kompakt fürs Ganze-ohne-Scrollen:** Tim wollte explizit, dass die Desktop-Ansicht
komplett ohne Scrollen in ein normales Fenster passt. Deshalb auf Desktop reduziert:
`body`-Padding (24px oben/unten statt 48+70px), `.header`-Abstand (18px statt 40px),
`.section`-Padding (14px/16px statt 20px/18px), Grid-`gap` (16px statt 24px). Der
grösste Einzelposten war das Kalender-Widget (volles `aspect-ratio:1` pro Tag-Kachel
über bis zu 6 Wochenzeilen) - dort `aspect-ratio` aufgehoben und eine feste, niedrige
`height` gesetzt (nur `#section-kalender-widget .kalender-tag`, NICHT die interaktive
Kalender-Ansicht im Menü - die bleibt bewusst normal gross). Getestet: passt bei
1366×768 UND sogar bei 1366×700 noch mit ca. 49px Luft. Bei sehr kleinen/schmalen
Fenstern (schon unterhalb von 900px greift ohnehin die Handy-Ansicht) kann trotzdem
Scrollen nötig werden - das ist kein Bug, nur eine praktische Grenze.

**Hausaufgaben-Widget** (`section-hausaufgaben-widget`): NUR im Desktop-Grid sichtbar
(per CSS `display:none` als Basis, `display:block` in der Media Query - diese
Reihenfolge ist wichtig, siehe Kommentar im CSS). Zeigt die offenen (nicht erledigten)
Hausaufgaben mit echter Checkbox zum Abhaken direkt auf der Hauptseite, ohne ins Menü
zu müssen - Tim nutzt den Hausaufgabenmanager öfter am PC. Nutzt dieselbe
`renderFolderListe()` wie die Schule-Ansicht, jetzt mit einem vierten Parameter
`nurOffene` (`renderHausaufgabenWidget()` ruft mit `nurOffene=true` auf). Wird bei
JEDER Todo-Änderung mit aktualisiert (`renderTodo()` ruft es am Anfang mit auf), plus
einmal in `aktualisiereInhalt()` fürs erste Laden/den Foreground-Refresh.
**Falls Tim weitere "nur am PC nützliche" Widgets möchte:** gleiches Muster - Sektion
mit `display:none` Basis + `display:block` in der Media Query, in `grid-column: 2`
aufnehmen.

**Morgendliche Sachen auf dem Desktop ausgeblendet:** Tim nutzt den PC laut eigener
Aussage nur während/gegen Ende der Schule, nicht morgens davor. `istDesktopBreite()`
(app.js, `window.matchMedia("(min-width: 900px)")`) blendet auf dem Desktop aus:
Morgenroutine (`applyTimeOfDayLayout`) und den Bus-Hinweg/"Weg zur Kanti" in Phase
"vor"/"keineLektionen" (`handleBusSection`). **Der Heimweg-Bus (Phase "heimweg")
bleibt bewusst sichtbar** - den will Tim kurz vor Schulschluss evtl. noch am PC sehen.
Wichtig: dieselbe `#section-bus` zeigt je nach Phase "Weg zur Kanti" ODER "Heimweg" -
ist keine zwei getrennten Sektionen, nur ein anderer Text im selben Element.

**Kalender-Widget** (`section-kalender-widget`, nur Desktop) - **jetzt voll
interaktiv**, nicht mehr nur Ansicht: eigene Monats-Navigation (`kalender-widget-prev/
next`) und Tag-Klick öffnet ein eigenes, schwebendes Popup (`kalender-widget-popup`,
`.kalender-widget-popup` CSS-Klasse, `position:fixed` wie Notiz-/Flämmchen-Popup - das
Widget lebt auf der Hauptseite, ausserhalb des Menü-Overlays, kann das inline
positionierte Menü-Popup nicht mitbenutzen).
- **Eigener Monats-Stand** `kalenderWidgetJahr`/`kalenderWidgetMonat`, unabhängig vom
  Menü-Kalender (`kalenderJahr`/`kalenderMonat`) - im Menü blättern lässt das Widget
  unberührt und umgekehrt. **Wichtig:** diese beiden `let`-Variablen müssen GANZ OBEN
  im Skript stehen (vor dem `init()`-Aufruf), nicht erst bei den anderen
  Kalender-Funktionen weiter unten - `renderKalenderWidget()` liest sie schon während
  `init()` (über `aktualisiereInhalt()`), und `let` wird erst bei Erreichen der
  Deklarationszeile initialisiert (kein Hoisting). Genau das war ein echter Bug beim
  ersten Bauen ("Cannot access 'kalenderWidgetJahr' before initialization").
- `kalenderGridHtml(jahr, monat)` ist die aus `renderKalender()` herausgezogene,
  wiederverwendbare Grid-HTML-Funktion, von beiden Kalendern genutzt.
- Notiz-Änderungen in einem der beiden Kalender (Menü ODER Widget) rendern jeweils
  BEIDE neu (`renderKalender(); renderKalenderWidget();` in beiden Popup-Handlern),
  damit die "Notiz vorhanden"-Punkte überall synchron bleiben.

## Icon-Leiste am rechten Rand: horizontal auf dem Handy, vertikal auf dem Desktop

**Bildschirmgrössen-abhängig, nicht global!** Erste Version hatte die vertikale
Anordnung überall (auch Handy) - Tim wollte das Handy explizit unverändert
(ursprüngliche horizontale Reihe) und nur den Desktop vertikal.

- **Basis-Regel (Handy, < 900px):** `.icon-reihe` und `.icon-spalte` haben
  `flex-direction: row` - alle 5 Icons stehen nebeneinander wie ursprünglich. `body`
  hat symmetrisches Padding (`22px` links UND rechts).
- **Media Query (Desktop, ≥ 900px):** `.icon-reihe`/`.icon-spalte` bekommen
  `flex-direction: column` - Menü (☰) bleibt oben, Flämmchen/Sport-Hinweis/Notiz/
  Hausaufgaben-Schnellzugriff stehen darunter in `.icon-spalte`. Zusätzlicher Platz
  dafür kommt über das (schon für die Desktop-Kompaktierung vorhandene) `body`-Padding
  rechts (74px statt 22px).

Beide Container nutzen Flexbox statt einzeln `position:fixed` positionierter Icons -
Grund: ein ausgeblendetes Icon (z. B. Sport-Hinweis ohne Sport morgen) hinterlässt so
keine Lücke, die übrigen rutschen automatisch zusammen (horizontal auf dem Handy,
vertikal auf dem Desktop). Neue Icons hier IMMER als Kind von `.icon-reihe`
(Menü-Ebene) oder `.icon-spalte` (alles andere) einfügen, nie wieder einzeln
`position:fixed`.

**Reihenfolge unterscheidet sich bewusst zwischen Handy und Desktop, deshalb über
CSS `order` gelöst, NICHT über die HTML/DOM-Reihenfolge:**
- Handy (links → rechts): Hausaufgaben-Schnellzugriff, Sport-Hinweis, Notiz,
  Flämmchen, Menü ganz rechts.
- Desktop (oben → unten): Menü ganz oben, dann Flämmchen, Sport-Hinweis, Notiz,
  Hausaufgaben-Schnellzugriff.

Eine einzige DOM-Reihenfolge hätte das nicht für beide gleichzeitig hinbekommen (Menü
müsste gleichzeitig "zuletzt" (Handy) und "zuerst" (Desktop) im Dokument stehen). Jedes
Icon hat daher eine eigene `order`-Regel in der Basis-CSS (Handy) UND nochmal
überschrieben in der `@media (min-width: 900px)`-Regel (Desktop). **Bei neuen Icons:
für beide Breakpoints eine `order`-Zahl vergeben, sonst hängt es an zufälliger Stelle.**

## Tagesfortschritt-Balken

Neben der Begrüssung (`#section-tagesfortschritt` im `.header`) - der Platz, der durch
die vertikale Icon-Leiste oben frei wurde. Zeigt, wie viel vom Schultag (erste bis
letzte Lektion laut `STUNDENPLAN`) bereits vorbei ist, als schmaler Balken + Prozent-
Text. `renderTagesfortschritt(phase)` in app.js, nur sichtbar in den Phasen
"vor"/"unterricht"/"heimweg" UND wenn heute überhaupt Lektionen anstehen (sonst gibt es
keinen "Schultag" zum Anzeigen). War eine von mehreren vorgeschlagenen Ideen für den
frei gewordenen Bereich - Tim hat sich für diese entschieden (Alternativen wären ein
Live-Countdown zum nächsten Ereignis oder die Streak gross dargestellt gewesen, falls
er das später doch noch will).

## Flämmchen (Streak-Feature, Duolingo/Snapchat-Stil)

Eigenes Icon oben rechts (Flammen-SVG, `right: 140px` in der Icon-Reihe), analog zum
Notiz-Muster: Icon → Popup, plus eine Vorschau-Sektion auf der Hauptseite
(`section-flaemmchen-preview`), die - wie Wetter/News - nur beim ersten Mal pro Tag
offen ist und danach verschwindet, bis nur noch das Icon übrig bleibt. Zusätzlich ein
eigener Menü-Punkt "Flämmchen" (neben Kalender/Einstellungen) mit einer reinen
Fakten-Übersicht (`renderFlaemmchenDetail()`) - **Abhaken selbst geht nur über das
Popup/Icon**, damit keine zweiten Checkboxen mit doppelten IDs im Menü nötig sind.

- **Aufgaben-Pools** in data.js: `FLAEMMCHEN_TAEGLICH` (~30), `_WOECHENTLICH` (~12),
  `_MONATLICH` (~8) - frei von Tim erweiterbar, gemischt aus produktiv/sportlich/
  sozial/gesund. Bewusst grosszügig bemessen: Tim wollte ursprünglich "nie wiederholende"
  Aufgaben, was ohne Cloud/KI-Anbindung nicht 100%ig geht (feste Liste muss sich
  irgendwann wiederholen) - als Kompromiss deutlich grössere Listen, damit die
  Wiederholung erst nach Wochen/Monaten überhaupt auffällt. Wasser-Trinken ist bewusst
  nur noch EIN möglicher Eintrag in `FLAEMMCHEN_TAEGLICH", nicht mehr ein eigenes
  Wasser-Feature (das gab es kurz, wurde auf Tims Wunsch wieder entfernt).
- **Auswahl deterministisch, kein Zufall/Speicher nötig:** `heutigeFlaemmchenAufgabe()`
  nutzt Tag-im-Jahr modulo Listenlänge, `wochenFlaemmchenAufgabe()` Woche-im-Jahr,
  `monatsFlaemmchenAufgabe()` den Monat. Bleibt beim Neuladen also stabil gleich.
- **Drei unabhängige Streaks** (Tag/Woche/Monat), über eine generische Konfiguration
  `FLAEMMCHEN_EINHEITEN` in app.js (nicht dreimal denselben Code). Pro Einheit
  gespeichert: aktuelle Streak, `letzter<Einheit>` (zuletzt erledigter Schlüssel, z. B.
  Wochenschlüssel `"2026-W34"`), Rekord (höchste je erreichte Streak) und Gesamtzahl
  erledigt. War die letzte Erledigung genau die Einheit davor -> Streak +1, sonst
  (Lücke) -> zurück auf 1. Abhaken rückgängig machen funktioniert nur innerhalb
  derselben Einheit (kein rückwirkendes Mehrperioden-Undo - bewusst einfach gehalten).
  `flaemmchenAngezeigterStreak(einheit)` zeigt eine bereits gerissene Streak sofort als
  0 an, auch bevor das nächste Abhaken den gespeicherten Wert offiziell zurücksetzt.
- Reine On-Page-Sache, kein Cloud-Sync, kein Push - Tim wollte hier bewusst erstmal
  keine grosse Detailtiefe bei der Wiederholungslogik ("nicht so detailliert wie Apple
  Erinnerungen").
- **Icon:** massive, einfarbige Flamme OHNE Ausschnitt in der Mitte (`fill="currentColor"`,
  ein einzelner Pfad). `flammeSvg(groesse)` in app.js für die Kacheln, dieselbe
  Pfad-Definition auch hart codiert im `<button>` oben rechts in index.html (dort MUSS
  sie synchron gehalten werden, falls sich das Icon nochmal ändert). **Geschichte dazu:**
  Tims erstes Referenzbild zeigte eine Flamme mit weissem Loch in der Mitte - damit
  gebaut, kam bei ihm aber gar nicht gut an ("ziemlich scheisse", "ganz falsch
  verstanden"). Neues Referenzbild von ihm zeigte eine schlichte, volle Flamme ohne
  Loch - jetzt so umgesetzt (einfach den ohnehin vorhandenen äusseren Pfad ohne den
  inneren Loch-Pfad verwendet, `fill-rule="evenodd"` wieder entfernt). **Falls nochmal
  unzufrieden:** eher an der Form/Kontur selbst schrauben, nicht wieder ein Loch
  einbauen. Oben in der Icon-Spalte nur die kleine Tages-Flamme (bewusst NUR diese,
  nicht Woche/Monat - das wollte Tim explizit so).
- **Kachel-Layout im Menü** (`renderFlaemmchenDetail()`): eine grosse Kachel oben für
  den Tag, darunter zwei kleinere nebeneinander für Woche/Monat
  (`.flaemmchen-kacheln`/`.flaemmchen-kachel-reihe`). Das Popup (Icon oben rechts)
  bleibt bewusst die einfache gestapelte Liste - zu schmal für Kacheln nebeneinander.
- Aufgaben-Listen nochmals deutlich vergrössert (30/12/8 -> 54/24/16), damit
  Wiederholungen noch seltener auffallen.

## Editierbare Listen (Morgenroutine/Packliste/Abendroutine)

Eigener Menüpunkt "Listen" mit Tabs zum Umschalten zwischen den vier Listen
(Morgenroutine, Packliste Schule, Packliste Sport, Abendroutine) und derselben
Add/Delete-Optik wie die To-Do-Liste. `LISTEN_KONFIG` in app.js verknüpft jede Liste
mit ihrem localStorage-Key und dem data.js-Standardwert. `ladeListe(cfg)` liefert die
gespeicherte Version, oder - beim allerersten Aufruf, wenn noch nichts gespeichert
ist - eine Kopie des data.js-Standards. **Wichtig:** `MORGENROUTINE`/`PACKLISTE_SCHULE`/
`PACKLISTE_SPORT`/`ABENDROUTINE` in data.js sind dadurch nur noch die *Werkseinstellung*
beim allerersten Laden - danach zählt, was in `dayguide_liste_*` in localStorage steht.
Tim kann also entweder in der App selbst Punkte hinzufügen/löschen, oder weiterhin
data.js anpassen (wirkt sich aber nur aus, solange er die App-eigene Liste noch nicht
einmal editiert hat, bzw. bis er `localStorage.removeItem("dayguide_liste_...")` löscht).

## Bugfix: "Hinzufügen"-Button in Hausaufgaben/Lernplan tot (0×0-Box)

Tim: Klick auf "Hinzufügen" tat nichts. Ursache: der GENERISCHE Klick-Handler fürs
oberste Menü (`setupMenu()`) hing an `document.querySelectorAll(".menu-list-item")` -
**document-weit, nicht auf die oberste Liste beschränkt.** Die Schule-Unteransicht
(`#schule-liste`) nutzt dieselbe Klasse `.menu-list-item` für ihre drei Einträge
(mit `data-schule-view` statt `data-view`). Klickt man einen davon, feuerten BEIDE
Handler: der korrekte aus `setupSchuleMenu()` (zeigt `schule-hausaufgaben`) UND der
generische aus `setupMenu()`, der mit `view = item.dataset.view` (hier `undefined`,
da nur `data-schule-view` gesetzt ist) ALLE `detail-*`-Panels ausblendet (auch das
gerade erst gezeigte `detail-schule`) und danach beim Versuch,
`document.getElementById("detail-undefined")` zu benutzen, einen unbehandelten
`TypeError` wirft. Ergebnis: `detail-schule` blieb `display:none`, das Formular
darunter hatte dadurch eine 0×0-Bounding-Box - der Button war technisch da, aber
nirgends zum Antippen.

**Fix:** `list.querySelectorAll(".menu-list-item")` statt
`document.querySelectorAll(...)` in `setupMenu()` (`list` ist schon die Referenz auf
`#menu-list`). **Regel für neue verschachtelte Menüs:** Klassen wie `.menu-list-item`
NIE document-weit selektieren, wenn dieselbe Klasse auch in einer Unteransicht
wiederverwendet wird - IMMER auf den passenden Container scopen.

## Schule-Untermenü, Hausaufgaben- & Lernplanmanager

Der frühere Top-Level-Menüpunkt "Morgiger Stundenplan" ist jetzt in einem neuen
Menüpunkt "Schule" verschachtelt, zusammen mit den zwei neuen Managern. Eigene kleine
Liste-zu-Detail-Navigation INNERHALB von `detail-schule` (`zeigeSchuleListe()` /
`zeigeSchuleDetail(view)` in app.js), mit einem eigenen inneren "‹ Zurück"
(`#schule-back`), das nur auf die Schule-Liste zurückgeht - der äussere "‹ Zurück"
geht wie überall sonst direkt zur Hauptliste.

- **Hausaufgabenmanager** (`schule-hausaufgaben`): Fach wählen (`alleFaecher()` -
  alle eindeutigen `subject`-Werte aus `STUNDENPLAN`) → Art wählen ("Seiten": zwei
  Zahlenfelder von/bis, oder "Notiz": Freitext) → Datum → Hinzufügen. Landet als
  To-Do mit `folder: "hausaufgaben"` und wird zusätzlich an die Kalender-Notiz des
  Fälligkeitstags angehängt (`kalenderNotizErgaenzen()`, hängt an bestehenden Text an
  statt ihn zu überschreiben).
- **Lernplanmanager** (`schule-lernplan`): Fach wählen → Freitext "was lernen" →
  Datum → Hinzufügen. Zeigt zusätzlich die nächste anstehende Prüfung in diesem Fach
  an (`naechstePruefungFuerFach()`, matcht `PRUEFUNGEN` per `subject.startsWith(fach)`).
  Landet als To-Do mit `folder: "lernplan"`, genau wie Hausaufgaben auch im Kalender.
- **To-Do-Datenmodell erweitert:** `{text, done, folder, due}` - `folder` ist
  `undefined`/`null` für normale, manuell eingetippte Aufgaben (unverändert wie
  bisher), `"hausaufgaben"` oder `"lernplan"` für die beiden Manager. `renderTodo()`
  gruppiert jetzt: normale Aufgaben zuerst (wie bisher, keine Überschrift), danach -
  nur falls vorhanden - eine "Schule"-Überschrift mit "Hausaufgaben"/"Lernplan"
  Unter-Überschriften. **Wichtig:** Checkbox/Löschen-Buttons referenzieren den Index
  über `todos.indexOf(t)` (Objekt-Referenz), NICHT über die Position in der
  gefilterten/gruppierten Teilliste - sonst würden Klicks in einer Gruppe die falschen
  Einträge treffen.
- **Direkt abhakbar in der Übersicht:** `renderFolderListe(containerId, folder, leerText)`
  ist die gemeinsame Render-Funktion für `hausaufgaben-liste` UND `lernplan-liste` -
  zeigt eine echte, klickbare Checkbox pro Eintrag (nicht mehr nur ein statisches "✓").
  Tim wollte das explizit für Hausaufgaben ("sonst bin ich nicht sicher, was ich schon
  gemacht habe"), wurde aus Konsistenzgründen gleich auch für Lernplan mitgemacht.
- **Desktop-Widget ist jetzt Einstiegspunkt, nicht nur Anzeige:** Klick auf den Titel
  "Hausaufgaben" (`#hausaufgaben-widget-titel`, IMMER klickbar, egal ob Einträge da
  sind) ODER auf den Leer-Text "Keine offenen Hausaufgaben." springt direkt zum vollen
  Formular (`oeffneHausaufgabenSchnellzugriff()` - dieselbe Funktion wie beim
  Schnellzugriff-Icon). Der Titel-Listener sitzt einmalig in `setupSchuleMenu()`, NICHT
  in `renderHausaufgabenWidget()` (das würde bei jedem Todo-Update erneut feuern und
  Listener duplizieren) - der Leer-Text-Listener sitzt dagegen in
  `renderHausaufgabenWidget()`, das ist unproblematisch, weil dieses Element bei jedem
  Aufruf per `innerHTML` neu erzeugt wird (alter Listener verschwindet mit dem alten
  Element).
- **Schnellzugriff:** eigenes Icon oben rechts (`#hausaufgaben-shortcut-btn`,
  `right: 180px`), springt direkt in `schule-hausaufgaben`, ohne über "Schule" zu
  navigieren. **Bewusst NUR für Hausaufgaben, nicht für Lernplan** - Tim hat das
  explizit so gewünscht ("den Lernplanmanager kannst du unterordnen").
  Icon-Reihe von rechts nach links: Menü (20) → Notiz (60) → Sport-Hinweis (100,
  nur bedingt sichtbar) → Flämmchen (140) → Hausaufgaben-Schnellzugriff (180).
- **Morgen-Erinnerung** (`section-hausaufgaben-erinnerung`): zeigt in Phase `"vor"`
  alle Hausaufgaben mit `done:false` und `due <= heute` (also fällig heute oder
  überfällig) - reiner On-Page-Hinweis, kein Push (gleiches Prinzip wie
  Wasser/Lese-Erinnerung vorher). Gilt bewusst NUR für Hausaufgaben, nicht für
  Lernplan-Einträge (Tim hat das nur für Hausaufgaben gewünscht).
- **Offene Fragen/spätere Verfeinerung:** was bei überfälligen Aufgaben passieren
  soll (aktuell: bleiben einfach in der Erinnerung stehen, bis erledigt oder
  gelöscht), ob Lernplan auch eine eigene Morgen-Erinnerung bekommen soll.

## Heller/Dunkler Modus

Schalter in den Einstellungen (`#theme-toggle`, iOS-Switch-Optik wie Ferienmodus).
Standard ist dunkel (kein Attribut nötig dafür - alle Farben sind CSS-Variablen im
Basis-`:root`, siehe index.html). Heller Modus setzt `data-theme="light"` auf
`<html>`, das überschreibt die Variablen in einem `:root[data-theme="light"]`-Block
(u. a. `--bg`, `--text`, `--text-dim`, `--line`, `--popup-bg`, `--overlay-bg`,
`--tile-bg`, `--switch-thumb*`). Gespeichert in `localStorage.dayguide_theme`
("light"/"dark"). **Wichtig gegen Flackern:** ein kleines synchrones Inline-`<script>`
ganz früh im `<head>` (vor dem `<style>`-Block) setzt das Attribut schon vor dem ersten
Rendern, falls "light" gespeichert ist - sonst würde beim Laden kurz der dunkle Look
aufblitzen, bevor `setupTheme()` in app.js (läuft erst nach DOM-Aufbau) umschaltet.
Aktualisiert zusätzlich das `<meta name="theme-color">` (Browser-Chrome-Farbe auf
Mobile) passend mit. **Falls neue Farben hinzukommen:** immer als CSS-Variable in
beiden `:root`-Blöcken definieren, nie als hartkodierten Hex-Wert - sonst bricht der
helle Modus an der Stelle.

**Bugfix:** `--overlay-bg` (Menü-Hintergrund) war ursprünglich `rgba(...)` mit leichter
Transparenz (0.92/0.96). Tim empfand das im hellen Modus als "Fenster-Effekt" (man sieht
die Hauptseite noch leicht durchschimmern). Jetzt volldeckend (`#050505` dunkel /
`#fbfbfb` hell, kein Alpha-Kanal mehr) - Menü wirkt wie eine eigene Seite, nicht wie eine
durchsichtige Ebene darüber.

## Abend-Erinnerung

Reiner On-Page-Hinweis (kein Push/Service Worker - bewusst so entschieden, passt zu
"kein Backend"), unabhängig vom `wrap.append()`-Phasensystem gesteuert, analog zu
Sport-Hinweis/Notiz-Post-it: bleibt an fester Stelle im HTML, wird nur per
`style.display` ein-/ausgeblendet.

(Es gab hier zwischenzeitlich auch eine eigene Wasser-Erinnerungs-Sektion
(`section-wasser`) - wieder entfernt, siehe "Flämmchen" oben: Wasser-Trinken ist jetzt
einfach einer der möglichen Flämmchen-Aufgaben, kein eigenes Element mehr.)

- **Abend-Lese-Erinnerung (`section-lese-erinnerung`):** reiner Text-Hinweis
  ("Zeit, das Handy wegzulegen und zu lesen." - Text in `LESE_ERINNERUNG_TEXT`, data.js),
  sichtbar nur in Phase `"abend"` UND ab `LESE_ERINNERUNG_AB_STUNDE` (aktuell 22.5 = 22:30).
  Gesteuert über `handleLeseErinnerung(phase)`, aus `init()` aufgerufen.

## Tap-Flächen

Alle "✕"-Symbole (Notiz-Popup, Kalender-Popup, To-Do-Löschen) haben eine grosszügige,
unsichtbare Tap-Fläche (`padding` + kompensierendes negatives `margin`, damit das Symbol
optisch an derselben Stelle bleibt) - Tim hat die alten, zu kleinen Tap-Flächen öfter
verfehlt. Neue "✕"/"Schliessen"-Buttons sollten densselben Trick verwenden statt nur
`padding: 0 4px` o.ä.

## iOS-Zoom-Bug bei Texteingaben (behoben)

Tim berichtete: nach dem Schreiben einer Notiz (Textfeld verlassen) blieb der
Bildschirm auf dem iPhone reingezoomt, musste manuell wieder rausgezoomt werden.
Ursache: iOS Safari zoomt beim Fokussieren eines Text-Inputs/Textarea automatisch
rein, wenn dessen `font-size` unter 16px liegt (Standard-Verhalten, kein Bug in
Arcday selbst, aber durch die 14px-Felder ausgelöst) - und zoomt beim Verlassen
nicht immer zuverlässig zurück. Behoben, indem `.notiz-edit`, `#kalender-popup-text`
und `.todo-add-row input` auf `font-size: 16px` gesetzt wurden. **Bei neuen
Text-Inputs/Textareas IMMER mindestens 16px verwenden**, sonst tritt derselbe Bug
wieder auf. (Absichtlich NICHT über `user-scalable=no` im Viewport-Meta gelöst -
das würde Pinch-Zoom für die ganze Seite deaktivieren, schlecht für Zugänglichkeit.)

## Wichtiger Bug, der heute behoben wurde

Mehrere Stellen nutzten `new Date(string).toISOString()`, was **UTC statt Lokalzeit**
zurückgibt. Das führte zu falschen Zeitvergleichen (z. B. Wetter-Vorhersage zeigte nur
"Vergangenheit"). Behoben durch:
- `parseLocalDateTime(str)` – parst "YYYY-MM-DDTHH:MM"-Strings manuell als lokale Zeit
- `heuteStr()` – baut das Datum manuell aus `getFullYear()/getMonth()/getDate()`
  statt `toISOString()`

**Falls du neue Zeit-Vergleiche mit Open-Meteo- oder anderen Zeitstempel-Strings
baust: IMMER `parseLocalDateTime()` nutzen, NIE `new Date(string)` direkt oder
`toISOString()` für Datums-Keys.**

## Checklisten-Muster

`renderChecklist(containerId, storageKeyPrefix, items, onChange)` ist die generische
Basis für alle abhakbaren Listen (Morgenroutine, Packliste, Abendroutine). Speichert
pro Tag (`heuteStr()`) einen eigenen Satz Keys in localStorage, resettet sich also
automatisch jeden Kalendertag.

**Checkbox-Optik:** `input[type=checkbox]` in `.checklist-row` ist per `appearance:none`
komplett neu gestylt: ein reiner weisser Ring auf Schwarz (aussen UND innen schwarz),
beim Abhaken erscheint ein weisses Häkchen (`::after`, rotiertes Border-Eck) im Ring -
KEIN volles Weiss-Fill, das wollte Tim explizit nicht. Gilt für To-Do und alle drei
echten Checklisten gemeinsam, da sie dieselbe CSS-Klasse teilen.

**Abhak-Animation:** Container von Morgenroutine/Packliste/Abendroutine haben zusätzlich
die Klasse `checklist-collapse` (NICHT die To-Do-Liste - deren Punkte sollen sichtbar
bleiben). Abgehakte `.checklist-row.done` kollabiert darin sanft (Opacity/max-height/
padding auf 0) statt abrupt zu verschwinden. Beim Wiederaufklappen (Haken entfernen)
kommt die Zeile genauso sanft zurück.

**Bug gefixt (war schon vorher im Code, nicht durch die obigen Punkte verursacht):**
`renderMorgenroutine()` hängte die "Losfahren spätestens"-Zeile per `el.innerHTML += ...`
an - das baut ALLE Kind-Elemente von `#morgenroutine-content` neu auf und zerstört damit
die Checkbox-Listener, die `renderChecklist()` gerade erst gesetzt hatte. Ergebnis:
Häkchen bei der Morgenroutine wurden nie in localStorage gespeichert (gingen beim
Neuladen verloren), an praktisch jedem Wochentag mit Fahrplan-Eintrag. Gefixt mit
`insertAdjacentHTML("beforeend", ...)` statt `innerHTML +=`. **Diese Falle gilt generell:
nie `innerHTML +=` auf einen Container verwenden, der schon Elemente mit eigenen
Event-Listenern enthält.**

- **Morgenroutine:** sichtbar nur in Phase `"vor"`. Enthält auch Kühlschrank-Sachen
  (Wasserflasche, Overnight Oats, Zmittag), die nicht am Vorabend eingepackt werden
  können. Zeigt zusätzlich "Losfahren spätestens" am Ende.
- **Packliste:** sichtbar ab `PACKLISTE_AB_STUNDE` (20.5 = 20:30) in Phasen
  `"heimweg"`/`"abend"`. Blendet sich automatisch aus, sobald alle Punkte abgehakt sind
  (`pruefeVollstaendig()`). Enthält nur Sachen, die wirklich am Vorabend einpackbar sind.
- **Abendroutine:** dieselbe Sichtbarkeits-Logik wie Packliste, separate Liste
  (Kleider bereitlegen, Gesicht waschen, Zähne putzen).
- **Sport-Hinweis:** kleines Hantel-Icon oben rechts, keine Checkliste. Schulsport
  (aus `STUNDENPLAN`, Fach enthält "SPO") nur bis Unterrichtsbeginn sichtbar,
  persönlicher Sport (`PERSOENLICHE_SPORT_TAGE`, aktuell Fr/Sa Fitness) den ganzen Tag.
  Abend-Vorschau ab 17 Uhr für den nächsten Tag.

## Notiz (Post-it)

- Stift-Icon oben rechts öffnet ein kleines Popup zum Schreiben (nicht mehr die alte
  grosse Box).
- Sobald Text gespeichert wird (Blur des Textfelds), erscheint zusätzlich ein Post-it-
  Abschnitt ganz oben auf der Hauptseite (`#section-notiz-postit`), der den Text prominent
  zeigt. Klick darauf öffnet wieder das Bearbeiten-Popup.
- Leerer Text → Post-it verschwindet automatisch wieder, nur das Stift-Icon bleibt.
- Lösch-Kreuz (✕) im Popup hat extra grosse (unsichtbare) Tap-Fläche für Mobile.
- **Post-it nur sichtbar, wenn ein Text drinsteht** (sonst nur das kleine Stift-Icon
  oben) - siehe Abschnitt "Notiz-Post-it: nur sichtbar mit Text" weiter unten für die
  kurze Geschichte dazu, war zwischenzeitlich anders.
- **Bug gefixt:** Klick aufs Post-it öffnete das Popup, aber ein globaler
  Klick-ausserhalb-schliesst-Listener (`document.addEventListener("click", ...)`) hat es
  im selben Klick sofort wieder zugemacht, weil der Klick vom Post-it zum `document`
  hochgeblubbert ist. Gefixt mit `e.stopPropagation()` im Post-it-Klick-Handler (genau wie
  der Notiz-Button `btn` das schon hatte). **Bei neuen "Icon/Fläche öffnet ein Popup"-
  Mustern IMMER daran denken:** wenn es einen globalen Klick-ausserhalb-schliesst-Listener
  gibt, braucht der ÖFFNEN-Klick `e.stopPropagation()`, sonst schliesst er sich sofort
  wieder selbst.
- **Nur noch EIN Antippen zum Bearbeiten** (Tim: "ich muss auf die Notiz drücken und
  dann auch noch aufs kleine Notes-Ding drücken" - der alte Zwei-Schritt-Ablauf
  `notiz-display` (Vorschau, erst anklicken) → `notiz-edit` (Textfeld) ist komplett weg.
  - **Post-it-Kachel** (`section-notiz-postit`): ein Antippen verwandelt die Kachel
    SELBST in ein Textfeld (`notiz-postit-edit`) - kein Popup, Tim wollte ausdrücklich
    "im Homebildschirm reinschreiben können". Blur speichert und schaltet zurück auf
    Anzeige.
  - **Stift-Icon-Popup** (`notiz-popup`): zeigt jetzt direkt das Textfeld, kein
    `notiz-display`-Zwischenschritt mehr. Nur noch relevant, wenn gerade keine Notiz
    existiert (Post-it dann unsichtbar) oder als Alternative über den Notiz-Pin in der
    To-Do-Liste.
  - Beide Wege schreiben in dieselbe `speichern(text)`-Hilfsfunktion in `loadNotiz()`,
    die localStorage, Post-it-Anzeige, Popup-Textfeld-Wert und `renderTodo()` (für den
    Notiz-Pin) synchron hält.
- **Zusätzlich in der To-Do-Liste angeheftet:** `renderTodo()` zeigt, falls eine Notiz
  gespeichert ist, ganz oben einen optisch abgesetzten Pin-Eintrag (`#todo-notiz-pin`)
  mit dem Notiz-Text. Klick darauf schliesst das Menü und öffnet das Notiz-Popup.
  `loadNotiz()` ruft nach Speichern/Löschen zusätzlich `renderTodo()` auf, damit der Pin
  synchron bleibt, auch wenn die To-Do-Liste gerade gar nicht offen ist (billig, da
  `renderTodo()` early-returnt, wenn `#todo-list` nicht im DOM sichtbar wäre - ist es aber
  immer, nur per `display` versteckt).
- **Geräteübergreifende Sync bewusst NICHT gebaut:** Tim wollte ursprünglich, dass
  dieselbe Notiz auf Handy und PC erscheint (Idee: über Obsidian). Technisch nicht
  machbar ohne eigenen Server/Cloud-Speicher (Obsidians lokale REST-API ist nur vom
  jeweiligen Gerät selbst erreichbar, nicht von der gehosteten Seite aus). Tim möchte das
  später nochmal angehen, evtl. mit einem kleinen Cloud-Speicher-Dienst - siehe
  "Bekannte offene Punkte" unten.

## Menü (☰ oben rechts)

Erst eine Liste (Morgiger Stundenplan, Wochenplan, To-Do, Kalender, Einstellungen),
Klick auf einen Punkt zeigt die Detailansicht mit "‹ Zurück". Kein direkter Sprung in
eine Unteransicht mehr (war ein früherer Kritikpunkt von Tim).

**Öffnen/Schliessen per Wisch-Geste:** `setupSwipeMenu()` in app.js hört global auf
`touchstart`/`touchend`. Nach links wischen (Finger bewegt sich nach links) öffnet das
Menü, nach rechts wischen schliesst es - unabhängig vom aktuellen Zustand. Schwelle:
mind. 60px horizontal UND deutlich mehr horizontal als vertikal (sonst würde normales
Scrollen das Menü mit auslösen). Passend dazu hat
`.menu-overlay` jetzt eine Slide-Transition (`transform: translateX(...)` statt
`display: none/flex`), damit es sich beim Öffnen/Schliessen sichtbar von rechts
hinein-/hinausschiebt.

- **Wochenplan:** zeigt Mo–So, inkl. Meal-Prep-Hinweise (`MEAL_PREP` in data.js:
  Mittwochabend Overnight Oats, Sa/So kochen fürs Wochenende).
- **To-Do:** einfache Liste, persistiert dauerhaft (nicht tagesbasiert), in
  `localStorage.dayguide_todos` als JSON-Array. Zeigt oben angeheftet die aktuelle Notiz
  an, falls vorhanden (siehe Abschnitt "Notiz" oben).
- **Kalender:** Monatsansicht mit Vor/Zurück-Pfeilen (`kalenderJahr`/`kalenderMonat` in
  app.js merken sich den gerade angezeigten Monat, unabhängig vom heutigen Datum).
  Markiert Prüfungstage (`PRUEFUNGEN`, Punkt unten am Tag) UND Tage mit eigener
  Kalender-Notiz (Punkt oben am Tag, `dayguide_kalender_notizen` in localStorage, Format
  `{"JJJJ-MM-TT": "Text"}`). Klick auf einen Tag öffnet ein Popup zum Schreiben (analog
  zur Haupt-Notiz: Auto-Speichern beim Blur des Textfelds, ✕ löscht den Eintrag).
- **Flämmchen:** reine Fakten-Übersicht (Streak/Rekord/Gesamtzahl je Tag/Woche/Monat),
  siehe eigener Abschnitt "Flämmchen" unten. Abhaken geht bewusst nur über das
  Popup/Icon oben rechts, nicht hier.
- **Listen:** Editor für Morgenroutine/Packliste/Abendroutine, siehe eigener Abschnitt
  "Editierbare Listen" unten.
- **Einstellungen:** Ferienmodus-Schalter, jetzt als iOS-artiger Switch (`.ios-switch`,
  CSS-only mit verstecktem `<input type=checkbox>` + gestylten Sibling-Spans) statt
  normaler Checkbox mit Text.

## Scroll-Animation

Sektionen werden beim Scrollen kontinuierlich von "dunkel" zu "hell" (Opacity 0→1 +
leichtes Hochgleiten), gekoppelt an die Scroll-Position (`setupScrollReveal()`,
`requestAnimationFrame`-gedrosselt). **Bewusst kein `filter: brightness()` mehr** (wurde
entfernt, weil das auf Mobilgeräten ruckelte) – nur `opacity` und `transform`, das ist
performanter. Absicherung eingebaut: Am echten Seitenende wird immer alles voll sichtbar
erzwungen (kurze Seiten haben sonst nicht genug Scroll-Weg für die letzten Sektionen).

## Bekannte offene Punkte / Rückstand (nach Priorität von Tim)

1. ~~**Hausaufgabenmanager** + **Lernplanmanager**~~ – gebaut, getestet UND committet/
   gepusht, siehe eigener Abschnitt "Schule-Untermenü, Hausaufgaben- & Lernplanmanager"
   unten.
2. Bus-Berechnung: 10-Min-Vorlauf vor Unterrichtsbeginn einbauen (siehe oben)
3. Sprache Deutsch/Englisch umschaltbar
4. Tastenkombination am PC (**technisch nur möglich, wenn der Tab schon offen ist** –
   ein System-weiter Shortcut, der die Webseite von überall öffnet, geht mit einer
   Website nicht, das bräuchte eine native App)
5. ~~Streak-/Belohnungssystem (Duolingo-Stil)~~ – erledigt, siehe "Flämmchen" oben
6. Statistik/Zeitersparnis-Auswertung – eigenes grösseres Feature
7. RUECKWEG_LINIE (732, Nachmittag) noch nicht von Tim verifiziert
8. Notiz geräteübergreifend synchronisieren (Handy ↔ PC) – bewusst zurückgestellt.
   Direkt über Obsidian technisch nicht machbar (siehe Abschnitt "Notiz" oben), müsste ein
   kleiner Cloud-Speicher-Dienst sein. Tim will das später nochmal angehen.
9. ~~"Flämmchen"-Idee~~ – erledigt, siehe eigener Abschnitt oben.
10. ~~Homescreen-Kacheln neu anordnen~~ – erledigt in Form von Desktop-Grid +
    vertikaler Icon-Leiste + Tagesfortschritt-Balken, siehe jeweilige Abschnitte oben.
11. **Busplan-Übersicht** – Tim möchte den festen Fahrplan (`ETAPPE1_FAHRPLAN` u. ä.
    aus data.js) irgendwo im Menü einsehen können, auch am Vorabend (nicht nur, wenn die
    Live-Bus-Sektion morgens sowieso schon zeigt). Noch nicht gebaut/gescoped - einfachste
    Umsetzung wäre ein reiner Lese-Menüpunkt, der `ETAPPE1_FAHRPLAN` (und ggf. die
    Linien-Infos für Etappe 2/Heimweg) als Tabelle auflistet.
12. **Belohnungssystem fürs Flämmchen** – Tim: "z. B. einen Film anschauen dürfen" bei
    Streak-Meilensteinen. Noch sehr vage - vor dem Bauen klären: welche Meilensteine
    (z. B. 7/30/100 Tage?), was für Belohnungen (frei eintragbar durch Tim, oder feste
    Vorschläge?), ist es nur eine Anzeige/Erinnerung oder eine Art Freischaltung.
13. **Tastenkombination am PC** – siehe Punkt 4 weiter oben, gleiche technische
    Einschränkung gilt weiterhin (nur möglich, wenn der Tab schon offen ist).
14. **Geräteübergreifende Synchronisierung** (Notiz + generell) – siehe Abschnitt "Notiz"
    oben ("Zurückgestellt"). Tim hat das nochmal angesprochen, weiterhin ungeklärt/nicht
    gebaut, bräuchte einen Cloud-Speicher-Dienst.

## Wichtige Vorlieben von Tim (Chat-Kontext, evtl. weniger relevant für Claude Code)

- Immer Git-Befehle in Codeblöcken
- Bei Web-Chat: alle Dateien zusammen bereitstellen, damit "Alles herunterladen"
  funktioniert (für Claude Code irrelevant, da du direkt im Ordner arbeitest)
- Nach jeder Änderung die Live-URL zum Testen mitgeben
- Niemals Emojis, auch nicht im Chat mit ihm
