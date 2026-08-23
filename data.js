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

// Zusätzliche Sporttage, die NICHT im Stundenplan stehen (z. B. eigenes
// Fitness-Training). 0 = Sonntag ... 6 = Samstag. Schulsport (Fach "SPO"
// im Stundenplan) wird automatisch erkannt, hier nicht nötig einzutragen.
const PERSOENLICHE_SPORT_TAGE = [5, 6]; // Freitag, Samstag

// --- Standort für die Wetter-Abfrage ---
// Aktuell grob auf Kirchberg SG gesetzt. Falls das nicht stimmt,
// hier die echten Koordinaten eintragen (z. B. von Google Maps
// per Rechtsklick auf deinen Wohnort kopieren).
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

// Gehzeit von Zuhause zur Haltestelle Kirchberg Post, in Minuten.
const GEHZEIT_ZUHAUSE_HALTESTELLE = 10;

// --- Etappe 2: Wil Bahnhof -> Kanti (live per API) ---
// Name der Starthaltestelle, wie sie transport.opendata.ch kennt.
const ETAPPE2_START = "Wil SG, Bahnhof";

// Liniennummer, die Richtung Kanti fährt (nur diese wird berücksichtigt).
const ETAPPE2_LINIE = "733";

// Gehzeit vom Bahnhof Wil direkt zur Kanti, in Minuten.
const GEHZEIT_BAHNHOF_KANTI = 10;

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
