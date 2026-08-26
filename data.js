// ============================================================
// HIER TRÄGST DU DEINE PERSÖNLICHEN DATEN EIN.
// Diese Datei musst du bei Bedarf anpassen (z. B. neues Semester,
// neuer Fahrplan). Der Rest der App (app.js) liest nur daraus.
// ============================================================

// --- Persönliches ---
// Dein Name für die Begrüssung.
const USER_NAME = "Tim";

// Wie viele Minuten vor dem morgigen Bus der Wecker klingeln soll
// (wird abends bei der Begrüssung als Vorschlag angezeigt).
const WECKER_VORLAUF_MIN = 55;

// Ab welcher Uhrzeit (Stunde, 0-23) der Wecker-Hinweis überhaupt erscheint.
const ABEND_STUNDE = 21;

// Wie lange (in Minuten) nach Unterrichtsende die Heimweg-Anzeige noch
// sichtbar bleibt. Danach wird angenommen, dass du längst zuhause bist.
const HEIMWEG_FENSTER_MIN = 90;

// Zusätzliche Sporttage, die NICHT im Stundenplan stehen (z. B. eigenes
// Fitness-Training). 0 = Sonntag ... 6 = Samstag. Schulsport (Fach "SPO"
// im Stundenplan) wird automatisch erkannt, hier nicht nötig einzutragen.
const PERSOENLICHE_SPORT_TAGE = [5, 6]; // Freitag, Samstag

// --- Morgenroutine (wird vor Schulbeginn angezeigt, abhakbar) ---
// Enthält auch Sachen, die über Nacht im Kühlschrank sind und daher nicht
// schon am Vorabend eingepackt werden können.
const MORGENROUTINE = ["Gesicht waschen & Haare nass machen", "Proteinshake trinken", "Zähne putzen", "Anziehen", "Haare machen", "Toilette", "Wasserflasche", "Overnight Oats + Besteck", "Zmittag"];

// --- Packliste (wird abends für morgen angezeigt) ---
// Nur Sachen, die man wirklich am Vorabend schon einpacken kann.
const PACKLISTE_SCHULE = ["Laptop & Ladekabel", "Mäppchen", "Bücher & Ordner", "Hausaufgaben"];
const PACKLISTE_SPORT = ["Sportschuhe", "Sporthose", "Sport-T-Shirt"];

// --- Abendroutine (wird zusammen mit der Packliste angezeigt) ---
const ABENDROUTINE = ["Kleider für morgen bereitlegen", "Gesicht waschen", "Zähne putzen"];

// Ab welcher Uhrzeit (Dezimalstunden, z. B. 20.5 = 20:30) die Packliste
// abends überhaupt erscheint.
const PACKLISTE_AB_STUNDE = 20.5;

// --- Wasser-Erinnerung (Zähler pro Tag, tippen zum Erhöhen) ---
// Ab welcher Uhrzeit die Erinnerung überhaupt erscheint (11 = 11:00, "Mittag").
const WASSER_ERINNERUNG_AB_STUNDE = 11;
const WASSER_ZIEL = 8;

// --- Abend-Erinnerung: Handy weglegen und lesen ---
// Ab welcher Uhrzeit (Dezimalstunden, z. B. 22.5 = 22:30) der Hinweis erscheint.
const LESE_ERINNERUNG_AB_STUNDE = 22.5;
const LESE_ERINNERUNG_TEXT = "Zeit, das Handy wegzulegen und zu lesen.";

// --- "Flämmchen": tägliche/wöchentliche/monatliche Herausforderung mit Streak
// (Duolingo/Snapchat-Stil). Die Aufgabe wird deterministisch aus der jeweiligen
// Liste gewählt (Tag im Jahr / Woche im Jahr / Monat, siehe app.js) - bleibt beim
// Neuladen also gleich, kein Zufall/Speicher nötig. Frei anpassbar/erweiterbar,
// gerne eigene Ideen ergänzen oder Kategorien mischen (produktiv, sportlich,
// sozial, gesund).
const FLAEMMCHEN_TAEGLICH = [
  "Unter 10 Minuten Bildschirmzeit ausserhalb der Schule",
  "100 Liegestütze (über den Tag verteilt)",
  "Kalt duschen",
  "4 Liter Wasser trinken",
  "Jemandem ein ehrliches Kompliment machen",
  "10 Minuten meditieren oder bewusst nichts tun",
  "Ein Kapitel eines Buches lesen",
  "Zimmer komplett aufräumen",
  "30 Minuten spazieren, ohne Handy dabei",
  "Jemandem helfen, ohne gefragt zu werden",
  "Etwas Neues gelernt (Wort, Fakt, Fähigkeit) und aufgeschrieben",
  "Frühstück statt Handy als Erstes am Morgen",
];
const FLAEMMCHEN_WOECHENTLICH = [
  "Ein neues Rezept kochen",
  "Ein Telefongespräch statt Chat mit jemandem führen",
  "Einen Artikel/Podcast zu einem Thema ausserhalb der Schule konsumieren",
  "Schreibtisch/Zimmer einmal gründlich aufräumen",
  "Einen Tag komplett ohne Social Media",
];
const FLAEMMCHEN_MONATLICH = [
  "Ein Buch zu Ende lesen",
  "Ein neues Hobby/eine neue Fähigkeit ausprobieren",
  "Eine alte Freundschaft/einen alten Kontakt wieder auffrischen",
  "Einen ganzen Tag bewusst offline verbringen",
];

// Aktuell grob auf Kirchberg SG gesetzt. Falls das nicht stimmt,
// hier die echten Koordinaten eintragen (z. B. von Google Maps
// per Rechtsklick auf deinen Wohnort kopieren).
// --- Meal Prep (wird zusätzlich im Wochenplan angezeigt) ---
// 0 = Sonntag ... 6 = Samstag
const MEAL_PREP = {
  3: "Meal Prep: Overnight Oats vorbereiten",
  6: "Meal Prep vorbereiten",
  0: "Meal Prep vorbereiten",
};

// --- Standort für die Wetter-Abfrage ---
const WEATHER_LOCATION = {
  lat: 47.3833,
  lon: 9.2833,
  name: "Kirchberg SG"
};

// --- Etappe 1: Kirchberg Post -> Wil Bahnhof ---
// Feste Abfahrtszeiten pro Wochentag (0 = Sonntag ... 6 = Samstag).
// Format "HH:MM". Wenn kein Eintrag für einen Tag existiert,
// wird nichts angezeigt (z. B. am Wochenende).
const ETAPPE1_FAHRPLAN = {
  1: "07:35", // Montag
  2: "08:15", // Dienstag
  3: "08:15", // Mittwoch
  4: "06:45", // Donnerstag
  5: "06:45", // Freitag
};

// Zeit von Zuhause zur Haltestelle Kirchberg Post, in Minuten.
// Mit dem E-Scooter unterwegs, inkl. Puffer zum Abschliessen.
const ZEIT_ZUHAUSE_HALTESTELLE_MIN = 10;

// Fahrzeit Kirchberg Post -> Wil Bahnhof in Minuten, für die Ankunfts-
// Anzeige. Geschätzt, bitte bei Gelegenheit mit echtem Fahrplan prüfen.
const REISEZEIT_ETAPPE1_MIN = 12;

// --- Etappe 2: Wil Bahnhof -> Kanti (live per API) ---
// Name der Starthaltestelle, wie sie transport.opendata.ch kennt.
const ETAPPE2_START = "Wil SG, Bahnhof";

// Liniennummer, die Richtung Kanti fährt (nur diese wird berücksichtigt).
const ETAPPE2_LINIE = "733";

// Gehzeit vom Bahnhof Wil direkt zur Kanti, in Minuten.
const GEHZEIT_BAHNHOF_KANTI = 10;

// Wie lange du bereit bist, auf den Bus zu warten, bevor sich Laufen mehr
// lohnt. Unabhängig davon, ob das schneller wäre als Laufen.
const WARTETOLERANZ_MIN = 15;

// --- Heimweg: Kanti -> Wil Bahnhof -> Kirchberg Post ---
// ACHTUNG: Dieser Stationsname ist NICHT bestätigt, sondern geraten!
// Bitte auf transport.opendata.ch prüfen und ggf. korrigieren:
// https://transport.opendata.ch/v1/stationboard?station=Wil%20SG,%20Kantonsschule&limit=10
const HEIMWEG_START = "Wil SG, Kantonsschule";

// Wie viele Minuten vor Unterrichtsende auf Heimweg-Anzeige umgeschaltet wird.
const HEIMWEG_VORLAUF_MIN = 10;

// Liniennummer für Wil Bahnhof -> Kirchberg Post (Annahme: dieselbe Linie
// wie am Morgen, 732 – bitte prüfen, ob das auch abends/mittags so stimmt).
const RUECKWEG_LINIE = "732";

// --- Stundenplan ---
// weekday: 1 = Montag ... 5 = Freitag
// subject = Kürzel/Code wie im Schulplan (Fach-Klasse-Lehrperson), room = Raum
// end = Ende der Lektion (wird für die Heimweg-Berechnung gebraucht)
const STUNDENPLAN = [
  // Montag
  { weekday: 1, time: "08:10", end: "08:55", subject: "F-1d-Mar", room: "K211" },
  { weekday: 1, time: "09:00", end: "09:45", subject: "F-1d-Mar", room: "K211" },
  { weekday: 1, time: "10:05", end: "10:50", subject: "sW-1ade-Zq", room: "K103" },
  { weekday: 1, time: "10:55", end: "11:40", subject: "sW-1ade-Zq", room: "K103" },
  { weekday: 1, time: "13:00", end: "13:45", subject: "E-1d-Pp", room: "K207" },
  { weekday: 1, time: "13:50", end: "14:35", subject: "E-1d-Pp", room: "K207" },
  { weekday: 1, time: "14:40", end: "15:25", subject: "SPO-1cdM-Ec", room: "B" },
  { weekday: 1, time: "15:30", end: "16:15", subject: "SPO-1cdM-Ec", room: "B" },

  // Dienstag
  { weekday: 2, time: "09:00", end: "09:45", subject: "M-1d-Rs", room: "N101" },
  { weekday: 2, time: "10:05", end: "10:50", subject: "M-1d-Rs", room: "N101" },
  { weekday: 2, time: "10:55", end: "11:40", subject: "B-1d-Sy", room: "N001" },
  { weekday: 2, time: "13:00", end: "13:45", subject: "ICT-A-1d-Ec", room: "K111" },
  { weekday: 2, time: "13:50", end: "14:35", subject: "WR-1d-Zq", room: "K103" },
  { weekday: 2, time: "14:40", end: "15:25", subject: "WR-1d-Zq", room: "K103" },

  // Mittwoch
  { weekday: 3, time: "09:00", end: "09:45", subject: "F-1d-Mar", room: "K211" },
  { weekday: 3, time: "10:05", end: "10:50", subject: "GG-1d-Gr", room: "N104" },
  { weekday: 3, time: "10:55", end: "11:40", subject: "MU-1d-El", room: "A203" },
  { weekday: 3, time: "13:00", end: "13:45", subject: "KLA-1d-Kä", room: "K110" },
  { weekday: 3, time: "13:50", end: "14:35", subject: "C-1d-Bn", room: "N002" },
  { weekday: 3, time: "14:40", end: "15:25", subject: "E-1d-Pp", room: "K207" },
  { weekday: 3, time: "15:30", end: "16:15", subject: "B-1d-Sy", room: "N005" },

  // Donnerstag
  { weekday: 4, time: "07:20", end: "08:05", subject: "D-1d-Kä", room: "K110" },
  { weekday: 4, time: "08:10", end: "08:55", subject: "D-1d-Kä", room: "K110" },
  { weekday: 4, time: "09:00", end: "09:45", subject: "GG-1d-Gr", room: "N110" },
  { weekday: 4, time: "10:05", end: "10:50", subject: "MU-1d-El", room: "A203" },
  { weekday: 4, time: "10:55", end: "11:40", subject: "C-1d-Bn", room: "N002" },
  { weekday: 4, time: "13:00", end: "13:45", subject: "M-1d-Rs", room: "N110" },
  { weekday: 4, time: "13:50", end: "14:35", subject: "M-1d-Rs", room: "N110" },
  { weekday: 4, time: "14:40", end: "15:25", subject: "SPO-1cdM-Ec", room: "B" },

  // Freitag
  { weekday: 5, time: "07:20", end: "08:05", subject: "BK-1d-Me", room: "N102" },
  { weekday: 5, time: "08:10", end: "08:55", subject: "BK-1d-Me", room: "N102" },
  { weekday: 5, time: "09:00", end: "09:45", subject: "D-1d-Kä", room: "K110" },
  { weekday: 5, time: "10:05", end: "10:50", subject: "D-1d-Kä", room: "K110" },
  { weekday: 5, time: "10:55", end: "11:40", subject: "IN-1d-Sü", room: "K207" },
];

// --- Prüfungen ---
// date im Format "JJJJ-MM-TT"
const PRUEFUNGEN = [
  { date: "2026-08-11", subject: "D-1d-Kä – Abgabe Schreibprodukt" },
  { date: "2026-08-31", subject: "F-1d-Mar – Test 1: grammaire, vocabulaire" },
  { date: "2026-09-07", subject: "E-1d-Pp – English short test 2" },
  { date: "2026-09-10", subject: "M-1d-Rs – Klausur Nr. 1" },
  { date: "2026-09-11", subject: "C-1d-Bn – Prüfung 1" },
  { date: "2026-09-14", subject: "sW-1ade-Zg – W&R I" },
  { date: "2026-09-15", subject: "WR-1d-Zg – Wirtschaft & Recht I" },
  { date: "2026-09-16", subject: "B-1d-Sy – Prüfung 1" },
  { date: "2026-09-18", subject: "IN-1d-Sü – Digitale Daten 1" },
  { date: "2026-10-22", subject: "GG-1d-Gr – Geografie 1" },
  { date: "2026-10-26", subject: "E-1d-Pp – English short test 2" },
  { date: "2026-10-28", subject: "MU-1d-El – Notenlesen / Musescore" },
  { date: "2026-10-31", subject: "D-1d-Kä – Journal Zwischenstand" },
  { date: "2026-11-02", subject: "F-1d-Mar – Test 2: grammaire, vocabulaire" },
  { date: "2026-11-05", subject: "M-1d-Rs – Klausur Nr. 2" },
  { date: "2026-11-09", subject: "sW-1ade-Zg – W&R II" },
  { date: "2026-11-18", subject: "B-1d-Sy – Prüfung 2" },
  { date: "2026-11-19", subject: "D-1d-Kä – Prüfung Wortlehre" },
  { date: "2026-11-25", subject: "E-1d-Pp – English 3" },
  { date: "2026-12-02", subject: "GG-1d-Gr – Geografie 2" },
  { date: "2026-12-03", subject: "M-1d-Rs – Klausur Nr. 3" },
  { date: "2026-12-07", subject: "F-1d-Mar – Test 3: grammaire, vocabulaire" },
  { date: "2026-12-08", subject: "WR-1d-Zg – Wirtschaft & Recht II" },
  { date: "2026-12-09", subject: "B-1d-Sy – Prüfung 3" },
  { date: "2026-12-11", subject: "IN-1d-Sü – Digitale Daten 2" },
  { date: "2026-12-14", subject: "sW-1ade-Zg – W&R III" },
  { date: "2026-12-16", subject: "MU-1d-El – Praktisch" },
  { date: "2026-12-17", subject: "C-1d-Bn – Prüfung 2" },
  { date: "2027-01-04", subject: "F-1d-Mar – Test 4: examens oraux" },
  { date: "2027-01-06", subject: "E-1d-Pp – English 4" },
  { date: "2027-01-15", subject: "D-1d-Kä – Prüfung Satzlehre" },
  { date: "2027-01-18", subject: "D-1d-Kä – Journal Semester" },
];
