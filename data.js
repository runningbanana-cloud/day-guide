// ============================================================
// HIER TRÄGST DU DEINE PERSÖNLICHEN DATEN EIN.
// Diese Datei musst du bei Bedarf anpassen (z. B. neues Semester,
// neuer Fahrplan). Der Rest der App (app.js) liest nur daraus.
// ============================================================

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

// --- Stundenplan ---
// weekday: 1 = Montag ... 5 = Freitag
// Trag hier deine echten Lektionen ein.
const STUNDENPLAN = [
  { weekday: 1, time: "08:00", subject: "Mathematik", teacher: "" },
  { weekday: 1, time: "08:50", subject: "Deutsch", teacher: "" },
  // ... hier weitere Lektionen ergänzen
];

// --- Prüfungen ---
// date im Format "JJJJ-MM-TT"
const PRUEFUNGEN = [
  // { date: "2026-09-15", subject: "Mathematik" },
];
