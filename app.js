// ============================================================
// Diese Datei musst du normalerweise NICHT anfassen.
// Sie liest die Angaben aus data.js und zeigt sie auf der Seite an.
// ============================================================

const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function init() {
  setGreetingAndDate();
  const wochenende = istWochenende();
  applyTimeOfDayLayout(wochenende);
  loadWeather();
  if (!wochenende) {
    loadBus();
  }
  loadLessons(wochenende);
  loadExams();
}

function istWochenende() {
  const tag = new Date().getDay();
  return tag === 0 || tag === 6; // Sonntag oder Samstag
}

// --- Begrüßung & Datum ---
function setGreetingAndDate() {
  const now = new Date();
  const hour = now.getHours();
  let greeting = "Guten Morgen";
  if (hour >= 12 && hour < 18) greeting = "Guten Tag";
  else if (hour >= 18) greeting = "Guten Abend";
  document.getElementById("greeting").textContent = greeting;

  const dateStr = now.toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long" });
  document.getElementById("today-date").textContent = dateStr;
}

// --- Tagesablauf: morgens Bus/Wetter im Fokus, später Stundenplan/Prüfungen ---
function applyTimeOfDayLayout(wochenende) {
  const wetter = document.getElementById("section-weather");
  const bus = document.getElementById("section-bus");
  const lessons = document.getElementById("section-lessons");
  const exams = document.getElementById("section-exams");
  const wrap = wetter.parentElement;

  if (wochenende) {
    // Am Wochenende: Bus und Stundenplan komplett ausblenden
    bus.style.display = "none";
    lessons.style.display = "none";
    wrap.append(wetter, exams);
    wetter.classList.remove("compact");
    exams.classList.remove("compact");
    return;
  }

  bus.style.display = "";
  lessons.style.display = "";

  const hour = new Date().getHours();
  const istMorgen = hour < 13; // vor/während der Schule

  if (istMorgen) {
    // Reihenfolge: Wetter, Bus, dann kompakt Stundenplan, Prüfungen
    wrap.append(wetter, bus, lessons, exams);
    wetter.classList.remove("compact");
    bus.classList.remove("compact");
    lessons.classList.add("compact");
    exams.classList.add("compact");
  } else {
    // Reihenfolge: Stundenplan, Prüfungen zuerst, dann kompakt Wetter, Bus
    wrap.append(lessons, exams, wetter, bus);
    lessons.classList.remove("compact");
    exams.classList.remove("compact");
    wetter.classList.add("compact");
    bus.classList.add("compact");
  }
}

// --- Wetter (Open-Meteo, kein API-Key nötig) ---
async function loadWeather() {
  const el = document.getElementById("weather-content");
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LOCATION.lat}&longitude=${WEATHER_LOCATION.lon}&current=temperature_2m,weather_code&timezone=Europe%2FZurich`;
    const res = await fetch(url);
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const desc = weatherCodeToText(data.current.weather_code);
    el.className = "";
    el.innerHTML = `
      <div class="weather-row">
        <span class="weather-temp">${temp}°</span>
        <span class="weather-desc">${desc} · ${WEATHER_LOCATION.name}</span>
      </div>`;
  } catch (err) {
    el.className = "error";
    el.textContent = "Wetter konnte nicht geladen werden.";
  }
}

function weatherCodeToText(code) {
  // Vereinfachte Zuordnung der Open-Meteo WMO-Codes
  if (code === 0) return "Klar";
  if ([1, 2, 3].includes(code)) return "Bewölkt";
  if ([45, 48].includes(code)) return "Nebel";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67].includes(code)) return "Regen";
  if ([71, 73, 75, 77].includes(code)) return "Schnee";
  if ([80, 81, 82].includes(code)) return "Schauer";
  if ([85, 86].includes(code)) return "Schneeschauer";
  if ([95, 96, 99].includes(code)) return "Gewitter";
  return "Wechselhaft";
}

// --- Bus: Etappe 1 (fest) + Etappe 2 (live, mit Lauf-Empfehlung) ---
async function loadBus() {
  const el = document.getElementById("bus-content");
  const now = new Date();
  const weekday = now.getDay();

  let html = "";

  // Etappe 1: feste Zeit aus data.js
  const zeit1 = ETAPPE1_FAHRPLAN[weekday];
  if (zeit1) {
    html += `
      <div class="board-row">
        <span class="board-route">Kirchberg Post → Wil Bahnhof</span>
        <span class="board-time">${zeit1}</span>
      </div>`;
  } else {
    html += `<div class="board-row"><span class="board-route">Heute kein fixer Bus eingetragen</span></div>`;
  }

  el.innerHTML = html + `<div class="empty" id="etappe2-slot">Etappe 2 lädt…</div>`;

  // Etappe 2: live Abfahrten ab Wil Bahnhof, gefiltert nach passender Linie
  try {
    const url = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(ETAPPE2_START)}&limit=20`;
    const res = await fetch(url);
    const data = await res.json();

    // Nur Abfahrten der richtigen Linie berücksichtigen
    const passende = data.stationboard.filter(a => a.number === ETAPPE2_LINIE);
    const naechste = passende[0];
    const slot = document.getElementById("etappe2-slot");

    if (!naechste) {
      slot.className = "empty";
      slot.textContent = `Keine Abfahrt der Linie ${ETAPPE2_LINIE} gefunden.`;
      return;
    }

    const abfahrtPlan = new Date(naechste.stop.departure);
    const verspaetung = naechste.stop.delay || 0;
    const wartezeitMin = Math.round((abfahrtPlan - now) / 60000) + verspaetung;

    let rowsHtml = `
      <div class="board-row">
        <span class="board-route">${naechste.category}${naechste.number} → ${naechste.to}</span>
        <span class="board-time">${abfahrtPlan.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
          ${verspaetung > 0 ? `<span class="board-delay">+${verspaetung}′</span>` : ""}
        </span>
      </div>`;

    // Empfehlung: Bus vs. 10 Minuten laufen
    let empfehlung;
    if (wartezeitMin <= GEHZEIT_BAHNHOF_KANTI) {
      empfehlung = `Bus nehmen – du sparst ca. ${GEHZEIT_BAHNHOF_KANTI - wartezeitMin} Min. gegenüber Laufen.`;
    } else {
      empfehlung = `Lauf lieber – der Bus braucht ${wartezeitMin} Min. bis Abfahrt, zu Fuß bist du in ${GEHZEIT_BAHNHOF_KANTI} Min. da.`;
    }

    document.getElementById("etappe2-slot").outerHTML = rowsHtml +
      `<div class="recommendation">${empfehlung}</div>`;

  } catch (err) {
    const slot = document.getElementById("etappe2-slot");
    if (slot) {
      slot.className = "error";
      slot.textContent = "Live-Busdaten konnten nicht geladen werden.";
    }
  }
}

// --- Stundenplan ---
function loadLessons(wochenende) {
  if (wochenende) return; // Sektion ist ausgeblendet, nichts zu tun

  const el = document.getElementById("lessons-content");
  const weekday = new Date().getDay();
  const heute = STUNDENPLAN.filter(l => l.weekday === weekday).sort((a, b) => a.time.localeCompare(b.time));

  if (heute.length === 0) {
    el.className = "empty";
    el.textContent = "Keine Lektionen eingetragen.";
    return;
  }

  el.className = "";
  el.innerHTML = heute.map(l => `
    <div class="lesson-row">
      <span class="lesson-time">${l.time}</span>
      <span>${l.subject}${l.teacher ? " · " + l.teacher : ""}</span>
    </div>`).join("");
}

// --- Prüfungen ---
function loadExams() {
  const el = document.getElementById("exams-content");
  const now = new Date();
  const kommende = PRUEFUNGEN
    .map(p => ({ ...p, dateObj: new Date(p.date) }))
    .filter(p => p.dateObj >= now)
    .sort((a, b) => a.dateObj - b.dateObj);

  if (kommende.length === 0) {
    el.className = "empty";
    el.textContent = "Keine anstehenden Prüfungen eingetragen.";
    return;
  }

  el.className = "";
  el.innerHTML = kommende.map(p => {
    const tage = Math.ceil((p.dateObj - now) / (1000 * 60 * 60 * 24));
    return `
      <div class="exam-row">
        <span>${p.subject}</span>
        <span class="exam-days">in ${tage} Tag${tage === 1 ? "" : "en"}</span>
      </div>`;
  }).join("");
}

init();