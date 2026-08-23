// ============================================================
// Diese Datei musst du normalerweise NICHT anfassen.
// Sie liest die Angaben aus data.js und zeigt sie auf der Seite an.
// ============================================================

const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function init() {
  setGreetingAndDate();
  const phase = getTagesPhase();
  updateWeckerHinweis();
  updateSportHinweis(phase);
  loadNotiz();
  applyTimeOfDayLayout(phase);
  loadWeather();
  handleBusSection(phase);
  loadNextLesson(phase);
  loadLessons(phase === "wochenende");
  loadExams();
  loadNews();
  setupScrollReveal();
  updateFavicon();
  setInterval(updateFavicon, 5 * 60 * 1000); // alle 5 Min. neu zeichnen
}

// --- Easter Egg: Der Punkt auf dem Tabbogen-Icon wandert mit der Uhrzeit ---
function updateFavicon() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  const margin = size * 0.18;
  const x0 = margin, y0 = margin * 0.7, x1 = size - margin, y1 = size - margin * 0.3;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const rx = (x1 - x0) / 2, ry = (y1 - y0) / 2;
  const startDeg = 200, endDeg = 340;

  ctx.strokeStyle = "#8a8a8a";
  ctx.lineWidth = Math.max(1, size * 0.022);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, (startDeg * Math.PI) / 180, (endDeg * Math.PI) / 180);
  ctx.stroke();

  // Position des Punkts anhand der aktuellen Uhrzeit (06:00 bis 22:00 = ganzer Bogen)
  const now = new Date();
  const stunden = now.getHours() + now.getMinutes() / 60;
  const tagStart = 6, tagEnde = 22;
  let anteil = (stunden - tagStart) / (tagEnde - tagStart);
  anteil = Math.max(0, Math.min(1, anteil));
  const winkelRad = ((startDeg + (endDeg - startDeg) * anteil) * Math.PI) / 180;
  const px = cx + rx * Math.cos(winkelRad);
  const py = cy + ry * Math.sin(winkelRad);

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(px, py, size * 0.05, 0, Math.PI * 2);
  ctx.fill();

  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/png";
  link.href = canvas.toDataURL("image/png");
}

// --- Sektionen beim Reinscrollen von dunkel zu hell einblenden ---
function setupScrollReveal() {
  const sections = document.querySelectorAll(".section");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // nur einmal pro Sektion
      }
    });
  }, { threshold: 0.15 });

  sections.forEach(sec => {
    sec.classList.add("reveal");
    observer.observe(sec);
  });
}

// --- Merkzettel: ein Feld, Überschrift zeigt den Inhalt oder "Notes" ---
function loadNotiz() {
  const display = document.getElementById("notiz-display");
  const edit = document.getElementById("notiz-edit");
  const gespeichert = localStorage.getItem("dayguide_notiz") || "";

  updateNotizDisplay(display, gespeichert);
  edit.value = gespeichert;

  display.addEventListener("click", () => {
    display.style.display = "none";
    edit.style.display = "block";
    edit.focus();
  });

  edit.addEventListener("blur", () => {
    const text = edit.value.trim();
    localStorage.setItem("dayguide_notiz", text);
    updateNotizDisplay(display, text);
    edit.style.display = "none";
    display.style.display = "block";
  });
}

function updateNotizDisplay(display, text) {
  if (text) {
    display.textContent = text;
    display.className = "notiz-display filled";
  } else {
    display.textContent = "Notes";
    display.className = "notiz-display empty";
  }
}

function istWochenende() {
  const tag = new Date().getDay();
  return tag === 0 || tag === 6; // Sonntag oder Samstag
}

function getHeutigeLektionen() {
  const weekday = new Date().getDay();
  return STUNDENPLAN.filter(l => l.weekday === weekday).sort((a, b) => a.time.localeCompare(b.time));
}

function zeitHeuteAls(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

// --- Ermittelt die aktuelle Tagesphase: wochenende, vor, unterricht, heimweg, keineLektionen ---
function getTagesPhase() {
  if (istWochenende()) return "wochenende";

  const lektionen = getHeutigeLektionen();
  if (lektionen.length === 0) return "keineLektionen";

  const now = new Date();
  const ersterStart = zeitHeuteAls(lektionen[0].time);
  const letzte = lektionen[lektionen.length - 1];
  const letztesEnde = zeitHeuteAls(letzte.end || letzte.time);
  const heimwegSchwelle = new Date(letztesEnde.getTime() - HEIMWEG_VORLAUF_MIN * 60000);

  if (now < ersterStart) return "vor";
  if (now >= heimwegSchwelle) return "heimweg";
  return "unterricht";
}

// --- Steuert, welche Bus-Ansicht gezeigt wird: Hinweg, ausgeblendet (Unterricht) oder Heimweg ---
function handleBusSection(phase) {
  const bus = document.getElementById("section-bus");
  const label = document.getElementById("bus-label");

  if (phase === "vor" || phase === "keineLektionen") {
    bus.style.display = "";
    label.innerHTML = `Weg zur Kanti <span class="live-dot"></span>`;
    loadBusHinweg();
  } else if (phase === "heimweg") {
    bus.style.display = "";
    label.innerHTML = `Heimweg <span class="live-dot"></span>`;
    loadBusHeimweg();
  } else {
    // wochenende oder unterricht: Bus-Bereich ausblenden
    bus.style.display = "none";
  }
}

// --- Zeigt die nächste anstehende Lektion prominent an (nur während des Unterrichts) ---
function loadNextLesson(phase) {
  const section = document.getElementById("section-nextlesson");

  if (phase !== "unterricht") {
    section.style.display = "none";
    return;
  }

  const lektionen = getHeutigeLektionen();
  const now = new Date();
  const naechste = lektionen.find(l => zeitHeuteAls(l.time) > now);

  if (!naechste) {
    section.style.display = "none";
    return;
  }

  section.style.display = "";
  document.getElementById("nextlesson-content").innerHTML = `
    <div class="next-lesson-row">
      <span class="next-lesson-subject">${naechste.subject}</span>
      <span class="next-lesson-time">ab ${naechste.time}${naechste.room ? " · " + naechste.room : ""}</span>
    </div>`;
}

// --- Tagesablauf: passt Reihenfolge/Betonung der Sektionen an die Phase an ---
function applyTimeOfDayLayout(phase) {
  const wetter = document.getElementById("section-weather");
  const bus = document.getElementById("section-bus");
  const lessons = document.getElementById("section-lessons");
  const exams = document.getElementById("section-exams");
  const nextlesson = document.getElementById("section-nextlesson");
  const wrap = wetter.parentElement;

  if (phase === "wochenende") {
    // Am Wochenende: Bus, Stundenplan und Nächste-Stunde komplett ausblenden
    bus.style.display = "none";
    lessons.style.display = "none";
    nextlesson.style.display = "none";
    wrap.append(wetter, exams);
    wetter.classList.remove("compact");
    exams.classList.remove("compact");
    return;
  }

  bus.style.display = phase === "unterricht" ? "none" : "";
  lessons.style.display = "";

  if (phase === "unterricht") {
    // Während des Unterrichts: Nächste Stunde ganz oben, Stundenplan normal,
    // Wetter und Prüfungen kompakt nach hinten
    wrap.append(nextlesson, lessons, wetter, exams);
    lessons.classList.remove("compact");
    wetter.classList.add("compact");
    exams.classList.add("compact");
    return;
  }

  nextlesson.style.display = "none";
  const hour = new Date().getHours();
  const istMorgen = hour < 13; // vor Schule / früh am Tag

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

// --- Begrüßung & Datum ---
function setGreetingAndDate() {
  const now = new Date();
  const hour = now.getHours();
  let greeting = "Guten Morgen";
  if (hour >= 12 && hour < 18) greeting = "Guten Tag";
  else if (hour >= 18) greeting = "Guten Abend";
  document.getElementById("greeting").textContent = `${greeting} ${USER_NAME}`;

  const dateStr = now.toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long" });
  document.getElementById("today-date").textContent = dateStr;
}

// --- Wetter (Open-Meteo, kein API-Key nötig) ---
async function loadWeather() {
  const el = document.getElementById("weather-content");
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LOCATION.lat}&longitude=${WEATHER_LOCATION.lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FZurich&forecast_days=8`;
    const res = await fetch(url);
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const desc = weatherCodeToText(data.current.weather_code);
    const naechsteStunde = getNaechsteStundeText(data);

    el.className = "";
    el.innerHTML = `
      <div class="weather-row toggle-row">
        <span class="weather-temp">${temp}°</span>
        <span class="weather-desc">${desc} · ${WEATHER_LOCATION.name}</span>
      </div>
      ${naechsteStunde ? `<div class="weather-desc" style="margin-top:2px;">Nächste Stunde: ${naechsteStunde}</div>` : ""}
      <div class="toggle-hint">Mehr Prognose</div>
      <div class="expanded" style="display:none;"></div>
      <div class="toggle-hint" id="radar-toggle" style="margin-top:6px;">Regenradar</div>
      <div class="radar-container" id="radar-container" style="display:none;">
        <div id="radar-map"></div>
        <div class="radar-controls">
          <span class="radar-time" id="radar-time">–</span>
          <input type="range" class="radar-slider" id="radar-slider" min="0" max="0" value="0">
        </div>
        <div class="radar-credit">Karte: OpenStreetMap, CARTO · Regen: RainViewer</div>
      </div>`;

    const hint = el.querySelector(".toggle-hint");
    const panel = el.querySelector(".expanded");
    hint.addEventListener("click", () => {
      const geoeffnet = panel.style.display !== "none";
      if (geoeffnet) {
        panel.style.display = "none";
        hint.textContent = "Mehr Prognose";
      } else {
        if (!panel.dataset.gefuellt) {
          panel.innerHTML = buildWeatherForecastHtml(data);
          panel.dataset.gefuellt = "1";
        }
        panel.style.display = "block";
        hint.textContent = "Weniger anzeigen";
      }
    });

    const radarHint = document.getElementById("radar-toggle");
    const radarContainer = document.getElementById("radar-container");
    radarHint.addEventListener("click", () => {
      const geoeffnet = radarContainer.style.display !== "none";
      if (geoeffnet) {
        radarContainer.style.display = "none";
        radarHint.textContent = "Regenradar";
      } else {
        radarContainer.style.display = "block";
        radarHint.textContent = "Regenradar ausblenden";
        initRadarMap();
      }
    });
  } catch (err) {
    el.className = "error";
    el.innerHTML = `Wetter konnte nicht geladen werden. <span class="retry-link" onclick="loadWeather()">Nochmal versuchen</span>`;
  }
}

function getNaechsteStundeText(data) {
  const ziel = new Date();
  ziel.setHours(ziel.getHours() + 1, 0, 0, 0);
  const iso = ziel.toISOString().slice(0, 13); // "JJJJ-MM-TTTHH"
  const idx = data.hourly.time.findIndex(t => t.startsWith(iso));
  if (idx === -1) return null;
  return weatherCodeToText(data.hourly.weather_code[idx]);
}

// --- Regenradar mit Zeitschieberegler (RainViewer, kostenlos, kein Key nötig) ---
async function initRadarMap() {
  const mapDiv = document.getElementById("radar-map");
  if (mapDiv.dataset.initialisiert) return; // nur einmal laden
  mapDiv.dataset.initialisiert = "1";

  try {
    const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
    const daten = await res.json();
    const frames = [...(daten.radar.past || []), ...(daten.radar.nowcast || [])];

    if (frames.length === 0) {
      mapDiv.textContent = "Keine Radar-Daten verfügbar.";
      return;
    }

    const map = L.map("radar-map", { zoomControl: false, attributionControl: false })
      .setView([WEATHER_LOCATION.lat, WEATHER_LOCATION.lon], 9);

    // Dunkle Kartenunterlage mit Ortsnamen/Grenzen zur Orientierung
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 12,
      attribution: "© OpenStreetMap, © CARTO",
    }).addTo(map);

    // Eigene "Pane" für den Radar-Layer, damit wir per CSS-Filter aus den
    // Farben ein Schwarz-Weiss-Bild machen: Grauwerte + Invertierung.
    // Da stärkerer Regen bei RainViewer dunklere, gesättigtere Farben hat,
    // wird er nach der Invertierung automatisch heller/weisser.
    map.createPane("radarPane");
    map.getPane("radarPane").style.filter = "grayscale(1) invert(1) contrast(1.3) brightness(1.1)";

    const tileSize = 256;
    let radarLayer = null;

    function zeigeFrame(index) {
      const frame = frames[index];
      const url = `${daten.host}${frame.path}/${tileSize}/{z}/{x}/{y}/2/1_1.png`;
      if (!radarLayer) {
        radarLayer = L.tileLayer(url, { opacity: 0.85, pane: "radarPane" }).addTo(map);
      } else {
        radarLayer.setUrl(url);
      }
      document.getElementById("radar-time").textContent =
        new Date(frame.time * 1000).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
    }

    const slider = document.getElementById("radar-slider");
    slider.max = frames.length - 1;
    const jetztIndex = Math.max((daten.radar.past || []).length - 1, 0);
    slider.value = jetztIndex;
    zeigeFrame(jetztIndex);

    slider.addEventListener("input", () => zeigeFrame(Number(slider.value)));

    // Karte war beim Erstellen unsichtbar (display:none) -> Grösse neu berechnen
    setTimeout(() => map.invalidateSize(), 100);
  } catch (err) {
    mapDiv.textContent = "Regenradar konnte nicht geladen werden.";
  }
}

function buildWeatherForecastHtml(data) {
  const now = new Date();
  const heuteStr = now.toISOString().slice(0, 10);

  // Rest des Tages: stündlich, alle 3 Stunden, ab jetzt bis Mitternacht
  const restHtml = data.hourly.time
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.startsWith(heuteStr) && new Date(t) > now)
    .filter((_, idx) => idx % 3 === 0)
    .map(({ t, i }) => {
      const stunde = new Date(t).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
      const temp = Math.round(data.hourly.temperature_2m[i]);
      return `<div class="hourly-row"><span>${stunde}</span><span>${temp}°</span></div>`;
    }).join("");

  // Nächste 7 Tage (Index 0 = heute, also ab 1)
  const tageHtml = data.daily.time.slice(1, 8).map((datum, idx) => {
    const i = idx + 1;
    const tag = new Date(datum).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "numeric" });
    const desc = weatherCodeToText(data.daily.weather_code[i]);
    const max = Math.round(data.daily.temperature_2m_max[i]);
    const min = Math.round(data.daily.temperature_2m_min[i]);
    return `<div class="forecast-day-row"><span class="forecast-day-date">${tag}</span><span>${desc}</span><span>${max}° / ${min}°</span></div>`;
  }).join("");

  return `
    <div class="sub-label">Rest von heute</div>
    ${restHtml || '<div class="empty">Keine weiteren Werte für heute.</div>'}
    <div class="sub-label">Nächste 7 Tage</div>
    ${tageHtml}`;
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

// --- Bus: Hinweg (Etappe 1 fest + Etappe 2 live, mit Lauf-Empfehlung) ---
async function loadBusHinweg() {
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
    const url = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(ETAPPE2_START)}&limit=30`;
    const res = await fetch(url);
    const data = await res.json();

    // Nur Abfahrten der richtigen Linie berücksichtigen, die nächsten 3
    const passende = data.stationboard.filter(a => a.number === ETAPPE2_LINIE).slice(0, 3);
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

    const mainRowHtml = `
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

    const weitereHtml = passende.slice(1).map(a => {
      const zeit = new Date(a.stop.departure);
      const delay = a.stop.delay || 0;
      return `
        <div class="board-row">
          <span class="board-route">${a.category}${a.number} → ${a.to}</span>
          <span class="board-time">${zeit.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
            ${delay > 0 ? `<span class="board-delay">+${delay}′</span>` : ""}
          </span>
        </div>`;
    }).join("");

    document.getElementById("etappe2-slot").outerHTML = `
      ${mainRowHtml}
      <div class="recommendation">${empfehlung}</div>
      ${weitereHtml ? `
        <div class="toggle-hint" id="bus-toggle">Weitere Abfahrten</div>
        <div class="expanded" style="display:none;">${weitereHtml}</div>` : ""}`;

    const busHint = document.getElementById("bus-toggle");
    if (busHint) {
      const busPanel = busHint.nextElementSibling;
      busHint.addEventListener("click", () => {
        const geoeffnet = busPanel.style.display !== "none";
        busPanel.style.display = geoeffnet ? "none" : "block";
        busHint.textContent = geoeffnet ? "Weitere Abfahrten" : "Weniger anzeigen";
      });
    }

  } catch (err) {
    const slot = document.getElementById("etappe2-slot");
    if (slot) {
      slot.className = "error";
      slot.innerHTML = `Live-Busdaten konnten nicht geladen werden. <span class="retry-link" onclick="loadBusHinweg()">Nochmal versuchen</span>`;
    }
  }
}

// --- Bus: Heimweg (Kanti -> Wil Bahnhof -> Kirchberg Post, beides live) ---
async function loadBusHeimweg() {
  const el = document.getElementById("bus-content");
  const now = new Date();

  el.innerHTML = `
    <div class="empty" id="heim1-slot">Heimweg ab Kanti lädt…</div>
    <div class="sub-label">Ab Wil Bahnhof</div>
    <div class="empty" id="heim2-slot">Lädt…</div>`;

  // Etappe A: Kanti -> Wil Bahnhof
  try {
    const url = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(HEIMWEG_START)}&limit=30`;
    const res = await fetch(url);
    const data = await res.json();

    const passende = data.stationboard.filter(a => a.number === ETAPPE2_LINIE).slice(0, 3);
    const naechste = passende[0];
    const slot = document.getElementById("heim1-slot");

    if (!naechste) {
      slot.className = "empty";
      slot.textContent = `Keine Abfahrt der Linie ${ETAPPE2_LINIE} ab Kanti gefunden.`;
    } else {
      const abfahrtPlan = new Date(naechste.stop.departure);
      const verspaetung = naechste.stop.delay || 0;
      const wartezeitMin = Math.round((abfahrtPlan - now) / 60000) + verspaetung;

      let empfehlung;
      if (wartezeitMin <= GEHZEIT_BAHNHOF_KANTI) {
        empfehlung = `Bus nehmen – du sparst ca. ${GEHZEIT_BAHNHOF_KANTI - wartezeitMin} Min. gegenüber Laufen.`;
      } else {
        empfehlung = `Lauf lieber zum Bahnhof – der Bus braucht ${wartezeitMin} Min., zu Fuß bist du in ${GEHZEIT_BAHNHOF_KANTI} Min. da.`;
      }

      const weitereHtml = passende.slice(1).map(a => {
        const zeit = new Date(a.stop.departure);
        const delay = a.stop.delay || 0;
        return `
          <div class="board-row">
            <span class="board-route">${a.category}${a.number} → ${a.to}</span>
            <span class="board-time">${zeit.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
              ${delay > 0 ? `<span class="board-delay">+${delay}′</span>` : ""}
            </span>
          </div>`;
      }).join("");

      slot.outerHTML = `
        <div class="board-row">
          <span class="board-route">${naechste.category}${naechste.number} → ${naechste.to}</span>
          <span class="board-time">${abfahrtPlan.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
            ${verspaetung > 0 ? `<span class="board-delay">+${verspaetung}′</span>` : ""}
          </span>
        </div>
        <div class="recommendation">${empfehlung}</div>
        ${weitereHtml ? `
          <div class="toggle-hint" id="heim1-toggle">Weitere Abfahrten</div>
          <div class="expanded" style="display:none;">${weitereHtml}</div>` : ""}`;

      const heim1Hint = document.getElementById("heim1-toggle");
      if (heim1Hint) {
        const heim1Panel = heim1Hint.nextElementSibling;
        heim1Hint.addEventListener("click", () => {
          const geoeffnet = heim1Panel.style.display !== "none";
          heim1Panel.style.display = geoeffnet ? "none" : "block";
          heim1Hint.textContent = geoeffnet ? "Weitere Abfahrten" : "Weniger anzeigen";
        });
      }
    }
  } catch (err) {
    const slot = document.getElementById("heim1-slot");
    if (slot) {
      slot.className = "error";
      slot.innerHTML = `Live-Busdaten konnten nicht geladen werden. <span class="retry-link" onclick="loadBusHeimweg()">Nochmal versuchen</span>`;
    }
  }

  // Etappe B: Wil Bahnhof -> Kirchberg Post (nur nächste Abfahrt, zur Info)
  try {
    const url = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(ETAPPE2_START)}&limit=30`;
    const res = await fetch(url);
    const data = await res.json();

    const passende = data.stationboard.filter(a => a.number === RUECKWEG_LINIE)[0];
    const slot = document.getElementById("heim2-slot");

    if (!passende) {
      slot.className = "empty";
      slot.textContent = `Keine Abfahrt der Linie ${RUECKWEG_LINIE} gefunden.`;
      return;
    }

    const abfahrtPlan = new Date(passende.stop.departure);
    const verspaetung = passende.stop.delay || 0;

    slot.outerHTML = `
      <div class="board-row">
        <span class="board-route">${passende.category}${passende.number} → ${passende.to}</span>
        <span class="board-time">${abfahrtPlan.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
          ${verspaetung > 0 ? `<span class="board-delay">+${verspaetung}′</span>` : ""}
        </span>
      </div>`;
  } catch (err) {
    const slot = document.getElementById("heim2-slot");
    if (slot) {
      slot.className = "error";
      slot.innerHTML = `Live-Busdaten konnten nicht geladen werden. <span class="retry-link" onclick="loadBusHeimweg()">Nochmal versuchen</span>`;
    }
  }
}

// --- Wecker-Hinweis: erscheint ab dem Abend, 55 Min. vor dem morgigen Bus ---
function updateWeckerHinweis() {
  const el = document.getElementById("wecker-hinweis");
  const now = new Date();

  if (now.getHours() < ABEND_STUNDE) {
    el.style.display = "none";
    return;
  }

  const morgen = new Date();
  morgen.setDate(morgen.getDate() + 1);
  const busZeit = ETAPPE1_FAHRPLAN[morgen.getDay()];

  if (!busZeit) {
    el.style.display = "none"; // morgen kein fixer Bus (z. B. Wochenende)
    return;
  }

  const [h, m] = busZeit.split(":").map(Number);
  const abfahrt = new Date();
  abfahrt.setHours(h, m, 0, 0);
  const weckzeit = new Date(abfahrt.getTime() - WECKER_VORLAUF_MIN * 60000);
  const weckzeitStr = weckzeit.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });

  el.style.display = "flex";
  el.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="13" r="8"></circle>
      <path d="M12 9v4l3 2"></path>
      <path d="M5 3l-2 2"></path>
      <path d="M19 3l2 2"></path>
    </svg>
    ${weckzeitStr}`;
}

// --- Erkennt Schulsport (aus Stundenplan) und persönlichen Sport getrennt ---
function istSchulsporttag(weekday) {
  return STUNDENPLAN.some(l => l.weekday === weekday && l.subject.toUpperCase().includes("SPO"));
}
function istPersoenlicherSporttag(weekday) {
  return PERSOENLICHE_SPORT_TAGE.includes(weekday);
}

// --- Sport-Hinweis: Symbol ohne Text ---
// - Schulsport (Mo/Do laut Stundenplan): nur bis Unterrichtsbeginn, danach
//   ist das Zeug ja eh schon eingepackt
// - Persönlicher Sport (z. B. Fitness Fr/Sa): den ganzen Tag über
// - Am Vorabend (ab 17 Uhr), wenn der nächste Tag ein Sporttag ist
function updateSportHinweis(phase) {
  const el = document.getElementById("sport-hinweis");
  const now = new Date();
  const heute = now.getDay();
  const morgen = (heute + 1) % 7;
  const istAbend = now.getHours() >= 17;

  let zeigen = false;
  if (istPersoenlicherSporttag(heute)) zeigen = true;
  if (istSchulsporttag(heute) && phase === "vor") zeigen = true;
  if (istAbend && (istPersoenlicherSporttag(morgen) || istSchulsporttag(morgen))) zeigen = true;

  if (!zeigen) {
    el.style.display = "none";
    return;
  }

  el.style.display = "flex";
  el.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 8v8"></path>
      <path d="M18 8v8"></path>
      <path d="M3 10v4"></path>
      <path d="M21 10v4"></path>
      <path d="M6 12h12"></path>
    </svg>`;
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
      <span>${l.subject}${l.room ? " · " + l.room : ""}</span>
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

  const naeheGrenze = 5; // Tage
  const naeher = kommende.filter(p => tageBis(p.dateObj, now) <= naeheGrenze);
  const rest = kommende.filter(p => tageBis(p.dateObj, now) > naeheGrenze);

  el.className = "";
  const naeherHtml = naeher.length > 0
    ? naeher.map(p => examRowHtml(p, now)).join("")
    : `<div class="empty">Keine Prüfungen in den nächsten ${naeheGrenze} Tagen.</div>`;

  el.innerHTML = `
    ${naeherHtml}
    ${rest.length > 0 ? `
      <div class="toggle-hint" id="exams-toggle">Alle anstehenden anzeigen (${kommende.length})</div>
      <div class="expanded" style="display:none;">${rest.map(p => examRowHtml(p, now)).join("")}</div>` : ""}`;

  const examsHint = document.getElementById("exams-toggle");
  if (examsHint) {
    const examsPanel = examsHint.nextElementSibling;
    examsHint.addEventListener("click", () => {
      const geoeffnet = examsPanel.style.display !== "none";
      examsPanel.style.display = geoeffnet ? "none" : "block";
      examsHint.textContent = geoeffnet ? `Alle anstehenden anzeigen (${kommende.length})` : "Weniger anzeigen";
    });
  }
}

function tageBis(dateObj, now) {
  return Math.ceil((dateObj - now) / (1000 * 60 * 60 * 24));
}

function examRowHtml(p, now) {
  const tage = tageBis(p.dateObj, now);
  return `
    <div class="exam-row">
      <span>${p.subject}</span>
      <span class="exam-days">in ${tage} Tag${tage === 1 ? "" : "en"}</span>
    </div>`;
}

// --- Neuigkeiten (Schweiz/Welt + Sport, per RSS über rss2json.com) ---
// Wird höchstens 2x pro Tag neu geladen: einmal morgens, einmal mittags.
const NEWS_FEEDS = [
  { url: "https://www.srf.ch/news/bnf/rss/1646", quelle: "SRF News" },
  { url: "https://www.srf.ch/sport/bnf/rss/718", quelle: "SRF Sport" },
];
const NEWS_CACHE_KEY = "dayguide_news_cache";

// Bei den Sport-Meldungen interessieren dich nur diese Kategorien (Whitelist).
// Alles andere Sportliche (Fussball, Reiten, Golf, Rudern, ...) wird raus-
// gefiltert. Normale News (nicht unter /sport/) sind davon nicht betroffen.
const SPORT_INTERESSEN_PFADE = ["/sport/motorsport/", "/sport/mehr-sport/rad/"];

function istErwuenschteMeldung(item) {
  const istSportKategorie = item.link.includes("/sport/");
  if (!istSportKategorie) return true; // normale News immer erlaubt
  return SPORT_INTERESSEN_PFADE.some(p => item.link.includes(p));
}

function getNewsSlot() {
  const hour = new Date().getHours();
  return hour < 12 ? "morgen" : "mittag";
}

function heuteStr() {
  return new Date().toISOString().slice(0, 10);
}

async function loadNews() {
  try {
    const aktuellerSlot = getNewsSlot();
    const heute = heuteStr();

    // Merkt sich, ob dieses Zeitfenster (morgen/mittag) heute schon
    // angeschaut wurde -> erstes Mal = volle Liste, danach kompakt.
    const gesehenKey = `dayguide_news_gesehen_${heute}_${aktuellerSlot}`;
    const erstesMal = !localStorage.getItem(gesehenKey);
    localStorage.setItem(gesehenKey, "1");

    const cacheRaw = localStorage.getItem(NEWS_CACHE_KEY);
    if (cacheRaw) {
      const cache = JSON.parse(cacheRaw);
      if (cache.datum === heute && cache.slot === aktuellerSlot) {
        renderNews(cache.items, erstesMal);
        return;
      }
    }

    const alle = [];
    for (const feed of NEWS_FEEDS) {
      const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items) {
        data.items.forEach(item => alle.push({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          description: item.description,
          quelle: feed.quelle,
        }));
      }
    }

    const gefiltert = alle.filter(istErwuenschteMeldung);
    gefiltert.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    const top = gefiltert.slice(0, 3); // maximal 3, kann auch weniger sein

    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({ datum: heute, slot: aktuellerSlot, items: top }));
    renderNews(top, erstesMal);
  } catch (err) {
    const el = document.getElementById("news-content");
    el.className = "error";
    el.innerHTML = `News konnten nicht geladen werden. <span class="retry-link" onclick="loadNews()">Nochmal versuchen</span>`;
  }
}

function renderNews(items, erstesMal) {
  const el = document.getElementById("news-content");
  if (!items || items.length === 0) {
    el.className = "empty";
    el.textContent = "Keine Neuigkeiten verfügbar.";
    return;
  }

  const listHtml = items.map(i => `
    <a class="news-row" href="${i.link}" target="_blank" rel="noopener">
      <span class="news-title">${i.title}</span>
      <span class="news-source">${i.quelle}</span>
    </a>`).join("");

  el.className = "";

  if (erstesMal) {
    // Erstes Mal in diesem Zeitfenster: volle Liste direkt zeigen
    el.innerHTML = listHtml;
    return;
  }

  // Schon gesehen: kompakt, per Klick aufklappbar
  const anzahlText = `${items.length} Meldung${items.length === 1 ? "" : "en"} anzeigen`;
  el.innerHTML = `
    <div class="toggle-hint" id="news-toggle">${anzahlText}</div>
    <div class="expanded" style="display:none;">${listHtml}</div>`;

  const hint = document.getElementById("news-toggle");
  const panel = hint.nextElementSibling;
  hint.addEventListener("click", () => {
    const geoeffnet = panel.style.display !== "none";
    panel.style.display = geoeffnet ? "none" : "block";
    hint.textContent = geoeffnet ? anzahlText : "Weniger anzeigen";
  });
}

init();
