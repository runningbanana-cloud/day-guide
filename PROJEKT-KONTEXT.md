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
- **Regenradar:** RainViewer API (kostenlos, kein Key), Schwarz-Weiss durch CSS-Filter
  (`grayscale(1) invert(1) contrast(1.3) brightness(1.1)`) auf einer eigenen Leaflet-
  Pane. RainViewer unterstützt nur Zoom bis Stufe 7 (`maxNativeZoom: 7`) – das ist eine
  Einschränkung von RainViewer selbst, kein Bug. Kartenunterlage: CartoDB dark_all
  (kostenlos, Zuschreibung nötig).
- **Regler:** Custom SVG-Halbkreis (kein natives `<input type="range">` mehr!), per
  Pointer-Events ziehbar, aktualisiert live sowohl die Regen-Kachel als auch eine
  synchronisierte Temperaturanzeige (`findeTemperaturFuerZeit()` sucht die nächstgelegene
  Stunde in den Open-Meteo-Stundendaten). **Das ist ein frisch gebautes, noch nicht
  gründlich getestetes Bedienelement** – Grösse/Trefferbereich könnten noch Justierung
  brauchen.

## Flämmchen (Streak-Feature, Duolingo/Snapchat-Stil)

Eigenes Icon oben rechts (Flammen-SVG, `right: 140px` in der Icon-Reihe), analog zum
Notiz-Muster: Icon → Popup, plus eine Vorschau-Sektion auf der Hauptseite
(`section-flaemmchen-preview`), die - wie Wetter/News - nur beim ersten Mal pro Tag
offen ist und danach verschwindet, bis nur noch das Icon übrig bleibt.

- **Aufgaben-Pools** in data.js: `FLAEMMCHEN_TAEGLICH`, `_WOECHENTLICH`, `_MONATLICH`
  (frei von Tim erweiterbar, gemischt aus produktiv/sportlich/sozial/gesund - genau wie
  er es wollte, z. B. "Kalt duschen", "4 Liter Wasser trinken", "100 Liegestütze").
- **Auswahl deterministisch, kein Zufall/Speicher nötig:** `heutigeFlaemmchenAufgabe()`
  nutzt Tag-im-Jahr modulo Listenlänge, `wochenFlaemmchenAufgabe()` Woche-im-Jahr,
  `monatsFlaemmchenAufgabe()` den Monat. Bleibt beim Neuladen also stabil gleich.
- **Streak:** `dayguide_flaemmchen_streak` (Zahl) + `dayguide_flaemmchen_letzter_tag`
  (Datum der letzten erledigten Aufgabe). Beim Abhaken: War der letzte Tag gestern ->
  Streak +1, sonst (Lücke) -> zurück auf 1. Abhaken rückgängig machen funktioniert nur
  am selben Tag (dann -1, kein rückwirkendes Mehrtage-Undo - bewusst einfach gehalten).
  `flaemmchenAngezeigterStreak()` zeigt eine bereits gerissene Streak sofort als 0 an,
  auch bevor das nächste Abhaken den gespeicherten Wert offiziell zurücksetzt.
- Reine On-Page-Sache, kein Cloud-Sync, kein Push - Tim wollte hier bewusst erstmal
  keine grosse Detailtiefe bei der Wiederholungslogik ("nicht so detailliert wie Apple
  Erinnerungen").

## Wasser- & Abend-Erinnerung

Beides sind reine On-Page-Hinweise (kein Push/Service Worker - bewusst so entschieden,
passt zu "kein Backend"), unabhängig vom `wrap.append()`-Phasensystem gesteuert, analog
zu Sport-Hinweis/Notiz-Post-it: bleiben an ihrer festen Stelle im HTML, werden nur per
`style.display` ein-/ausgeblendet.

- **Wasser (`section-wasser`):** Zähler pro Tag, Tippen auf "+" erhöht
  (`dayguide_wasser_<Datum>` in localStorage). Sichtbar ab `WASSER_ERINNERUNG_AB_STUNDE`
  (data.js, aktuell 11 Uhr), unabhängig von der Tagesphase - auch am Wochenende/im
  Ferienmodus relevant, da es nichts mit der Schule zu tun hat. War schon mal gebaut,
  wurde kurz danach wieder entfernt, jetzt mit Zeit-Gate erneut eingebaut.
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
Menü, nach rechts wischen schliesst es - unabhängig vom aktuellen Zustand. Ignoriert
bewusst Wischen, das auf `#radar-map`, `.radar-controls`, `.leaflet-container` oder
einem `input[type=range]` beginnt, damit Regenradar-Bedienung nicht versehentlich das
Menü umschaltet. Schwelle: mind. 60px horizontal UND deutlich mehr horizontal als
vertikal (sonst würde normales Scrollen das Menü mit auslösen). Passend dazu hat
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

1. **Hausaufgabenmanager** – laut Tim aktuell wichtiger als die Punkte darunter. Noch
   nicht geplant/gescoped.
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
9. "Flämmchen"-Idee – Tim hat nur angedeutet, dass es evtl. mit der Wasser-Erinnerung
   zusammenhängt, wollte es aber erst später genauer erklären. Noch nichts gebaut, nichts
   angenommen.

## Wichtige Vorlieben von Tim (Chat-Kontext, evtl. weniger relevant für Claude Code)

- Immer Git-Befehle in Codeblöcken
- Bei Web-Chat: alle Dateien zusammen bereitstellen, damit "Alles herunterladen"
  funktioniert (für Claude Code irrelevant, da du direkt im Ordner arbeitest)
- Nach jeder Änderung die Live-URL zum Testen mitgeben
- Niemals Emojis, auch nicht im Chat mit ihm
