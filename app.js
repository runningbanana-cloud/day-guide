// ============================================================
// Diese Datei musst du normalerweise NICHT anfassen.
// Sie liest die Angaben aus data.js und zeigt sie auf der Seite an.
// ============================================================

const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

// Kleines Bus-Symbol für die Bus-Labels
const BUS_ICON_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;">
  <rect x="4" y="4" width="16" height="13" rx="2"></rect>
  <path d="M4 12h16"></path>
  <path d="M7 20v-2"></path>
  <path d="M17 20v-2"></path>
</svg>`;

// Alles, was sich mit der Zeit ändert (Tagesphase, Wetter, Bus, News, Erinnerungen
// ...) - beliebig oft sicher aufrufbar, hängt KEINE neuen Event-Listener an.
// Getrennt von init(), damit wir das beim Zurückkommen aus dem Hintergrund
// (siehe visibilitychange unten) erneut aufrufen können, ohne alle Klick-
// Listener ein zweites Mal anzuhängen.
function aktualisiereInhalt() {
  setGreetingAndDate();
  const phase = getTagesPhase();
  updateWeckerHinweis();
  updateSportHinweis(phase);
  applyTimeOfDayLayout(phase);
  loadWeather();
  handleBusSection(phase);
  loadNextLesson(phase);
  loadLessons(phase === "wochenende");
  loadExams();
  loadNews();
  handleLeseErinnerung(phase);
  handleHausaufgabenErinnerung(phase);
  renderHausaufgabenWidget();
  renderKalenderWidget();
  aktualisiereFlaemmchenInhalt();
  updateFavicon();
}

function init() {
  aktualisiereInhalt();
  loadNotiz();
  setupScrollReveal();
  setupMenu();
  setupSwipeMenu();
  setupFlaemmchen();
  setInterval(updateFavicon, 30 * 60 * 1000); // alle 30 Min. neu zeichnen

  // iOS friert eine als App gespeicherte Seite im Hintergrund ein, statt sie
  // laufen zu lassen oder neu zu laden - beim Zurückkommen (z. B. nach dem
  // Schulende, wenn sich die Tagesphase geändert hat) sonst alles veraltet,
  // bis man manuell neu lädt. visibilitychange feuert zuverlässig, sobald die
  // Seite wieder sichtbar wird, und aktualisiert dann alles Zeitabhängige.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      aktualisiereInhalt();
    }
  });
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

  const cx = size / 2;
  const cy = size * 0.77;
  const rx = size * 0.34;
  const ry = size * 0.32;
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

// --- Sektionen beim Scrollen kontinuierlich von dunkel zu hell einblenden ---
function setupScrollReveal() {
  const reduzierteBewegung = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sections = Array.from(document.querySelectorAll(".section"));
  if (reduzierteBewegung) return; // Bewegung deaktiviert -> alles normal sichtbar lassen

  function update() {
    const vh = window.innerHeight;
    const zoneStart = vh;        // ganz unten am Bildschirmrand: noch dunkel
    const zoneEnde = vh * 0.55;  // etwa Bildschirmmitte: voll sichtbar

    // Absicherung: Wenn die Seite kurz ist, reicht der Scroll-Weg manchmal
    // nicht aus, damit die letzten Abschnitte ihre volle Sichtbarkeit über
    // die normale Positions-Berechnung erreichen. Sobald wirklich das Ende
    // der Seite erreicht ist, zeigen wir stattdessen alles sofort voll an.
    const maxScroll = document.documentElement.scrollHeight - vh;
    const amEnde = window.scrollY >= maxScroll - 2;

    // Erst ALLE Positionen auslesen (Read-Phase), dann erst ALLE Stile
    // setzen (Write-Phase) - vermeidet Layout-Thrashing, das auf dem
    // Handy sonst zu Rucklern führen kann.
    const werte = sections.map(sec => {
      if (amEnde) return 1;
      const rect = sec.getBoundingClientRect();
      let f = (zoneStart - rect.top) / (zoneStart - zoneEnde);
      return Math.max(0, Math.min(1, f));
    });

    sections.forEach((sec, i) => {
      const f = werte[i];
      sec.style.opacity = f;
      sec.style.transform = `translateY(${(1 - f) * 16}px)`;
    });
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener("resize", update);

  update();
  setTimeout(update, 800); // Inhalte laden teils nach, Seitenhöhe ändert sich
}

// --- Merkzettel: kleines Icon oben rechts öffnet ein Popup zum Bearbeiten,
// zusätzlich erscheint ein Post-it ganz oben, sobald wirklich was drinsteht ---
function loadNotiz() {
  const display = document.getElementById("notiz-display");
  const edit = document.getElementById("notiz-edit");
  const btn = document.getElementById("notiz-btn");
  const popup = document.getElementById("notiz-popup");
  const loeschen = document.getElementById("notiz-loeschen");
  const postitSection = document.getElementById("section-notiz-postit");
  const postitText = document.getElementById("notiz-postit-text");
  const gespeichert = localStorage.getItem("dayguide_notiz") || "";

  updateNotizDisplay(display, gespeichert);
  updatePostit(postitSection, postitText, gespeichert);
  edit.value = gespeichert;

  function popupOeffnen() {
    popup.style.display = "block";
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    popup.style.display = popup.style.display === "none" ? "block" : "none";
  });
  postitSection.addEventListener("click", (e) => {
    e.stopPropagation();
    popupOeffnen();
  });
  document.addEventListener("click", (e) => {
    if (popup.style.display !== "none" && !popup.contains(e.target) && e.target !== btn) {
      popup.style.display = "none";
    }
  });

  display.addEventListener("click", () => {
    display.style.display = "none";
    edit.style.display = "block";
    edit.focus();
  });

  edit.addEventListener("blur", () => {
    const text = edit.value.trim();
    localStorage.setItem("dayguide_notiz", text);
    updateNotizDisplay(display, text);
    updatePostit(postitSection, postitText, text);
    edit.style.display = "none";
    display.style.display = "block";
    popup.style.display = "none";
    renderTodo();
  });

  loeschen.addEventListener("click", (e) => {
    e.stopPropagation();
    localStorage.setItem("dayguide_notiz", "");
    edit.value = "";
    updateNotizDisplay(display, "");
    updatePostit(postitSection, postitText, "");
    renderTodo();
  });
}

// Post-it nur sichtbar, wenn wirklich ein Text drinsteht (ohne Text nur das
// kleine Stift-Icon oben) - Klick aufs Post-it öffnet dann direkt das
// Bearbeiten-Popup, ohne dass man nochmal aufs Icon gehen muss.
function updatePostit(section, textEl, text) {
  if (text) {
    textEl.textContent = text;
    section.style.display = "";
  } else {
    section.style.display = "none";
  }
}

// --- Abend-Erinnerung: ab LESE_ERINNERUNG_AB_STUNDE (data.js), nur in der
// Phase "abend" - passt zusammen mit Packliste/Abendroutine, die dann schon
// erledigt sein sollten. ---
function handleLeseErinnerung(phase) {
  const el = document.getElementById("section-lese-erinnerung");
  if (phase !== "abend") {
    el.style.display = "none";
    return;
  }
  const now = new Date();
  const stunden = now.getHours() + now.getMinutes() / 60;
  if (stunden < LESE_ERINNERUNG_AB_STUNDE) {
    el.style.display = "none";
    return;
  }
  document.getElementById("lese-erinnerung-text").textContent = LESE_ERINNERUNG_TEXT;
  el.style.display = "";
}

// --- "Flämmchen": tägliche/wöchentliche/monatliche Herausforderung + Streak ---
// Datumsstring (wie heuteStr()) für "heute minus n Tage" - lokal berechnet,
// NIE toISOString() (siehe "Wichtiger Bug" oben in PROJEKT-KONTEXT.md).
function datumStrVorTagen(tage) {
  const d = new Date();
  d.setDate(d.getDate() - tage);
  const jahr = d.getFullYear();
  const monat = String(d.getMonth() + 1).padStart(2, "0");
  const tag = String(d.getDate()).padStart(2, "0");
  return `${jahr}-${monat}-${tag}`;
}

function tagDesJahres(d) {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d - start) / 86400000);
}
function wochenSchluessel(d = new Date()) {
  return `${d.getFullYear()}-W${Math.floor(tagDesJahres(d) / 7)}`;
}
function monatSchluessel(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function heutigeFlaemmchenAufgabe() {
  return FLAEMMCHEN_TAEGLICH[tagDesJahres(new Date()) % FLAEMMCHEN_TAEGLICH.length];
}
function wochenFlaemmchenAufgabe() {
  const woche = Math.floor(tagDesJahres(new Date()) / 7);
  return FLAEMMCHEN_WOECHENTLICH[woche % FLAEMMCHEN_WOECHENTLICH.length];
}
function monatsFlaemmchenAufgabe() {
  return FLAEMMCHEN_MONATLICH[new Date().getMonth() % FLAEMMCHEN_MONATLICH.length];
}

// Drei unabhängige Streaks (Tag/Woche/Monat) über dieselbe generische Logik:
// aktuellerSchluessel() = "das hier", vorherigerSchluessel() = "die Einheit davor".
// War der zuletzt erledigte Schlüssel genau die Einheit davor -> Streak fortsetzen,
// sonst (Lücke) -> zurück auf 1.
const FLAEMMCHEN_EINHEITEN = {
  tag: {
    streakKey: "dayguide_flaemmchen_streak",
    letzterKey: "dayguide_flaemmchen_letzter_tag",
    rekordKey: "dayguide_flaemmchen_tag_rekord",
    gesamtKey: "dayguide_flaemmchen_tag_gesamt",
    aktuellerSchluessel: () => heuteStr(),
    vorherigerSchluessel: () => datumStrVorTagen(1),
  },
  woche: {
    streakKey: "dayguide_flaemmchen_woche_streak",
    letzterKey: "dayguide_flaemmchen_letzte_woche",
    rekordKey: "dayguide_flaemmchen_woche_rekord",
    gesamtKey: "dayguide_flaemmchen_woche_gesamt",
    aktuellerSchluessel: () => wochenSchluessel(),
    vorherigerSchluessel: () => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return wochenSchluessel(d);
    },
  },
  monat: {
    streakKey: "dayguide_flaemmchen_monat_streak",
    letzterKey: "dayguide_flaemmchen_letzter_monat",
    rekordKey: "dayguide_flaemmchen_monat_rekord",
    gesamtKey: "dayguide_flaemmchen_monat_gesamt",
    aktuellerSchluessel: () => monatSchluessel(),
    vorherigerSchluessel: () => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return monatSchluessel(d);
    },
  },
};

// Angezeigter Streak: gilt nur als "noch am Leben", wenn zuletzt in der aktuellen
// oder der direkt vorherigen Einheit erledigt wurde - sonst als gerissen (0)
// anzeigen, auch wenn der gespeicherte Wert erst beim nächsten Abhaken offiziell
// zurückgesetzt wird.
function flaemmchenAngezeigterStreak(einheit) {
  const cfg = FLAEMMCHEN_EINHEITEN[einheit];
  const streak = parseInt(localStorage.getItem(cfg.streakKey) || "0", 10);
  const letzter = localStorage.getItem(cfg.letzterKey) || "";
  if (letzter !== cfg.aktuellerSchluessel() && letzter !== cfg.vorherigerSchluessel()) return 0;
  return streak;
}

function flaemmchenUmschalten(einheit, erledigt) {
  const cfg = FLAEMMCHEN_EINHEITEN[einheit];
  const aktuell = cfg.aktuellerSchluessel();
  let streak = parseInt(localStorage.getItem(cfg.streakKey) || "0", 10);
  let gesamt = parseInt(localStorage.getItem(cfg.gesamtKey) || "0", 10);
  const rekord = parseInt(localStorage.getItem(cfg.rekordKey) || "0", 10);
  const letzter = localStorage.getItem(cfg.letzterKey) || "";

  if (erledigt) {
    if (letzter !== aktuell) {
      streak = letzter === cfg.vorherigerSchluessel() ? streak + 1 : 1;
      localStorage.setItem(cfg.streakKey, String(streak));
      localStorage.setItem(cfg.letzterKey, aktuell);
      localStorage.setItem(cfg.gesamtKey, String(gesamt + 1));
      if (streak > rekord) localStorage.setItem(cfg.rekordKey, String(streak));
    }
  } else if (letzter === aktuell) {
    // Rückgängig machen (nur möglich, solange man's noch in derselben Einheit umstösst)
    streak = Math.max(0, streak - 1);
    localStorage.setItem(cfg.streakKey, String(streak));
    localStorage.setItem(cfg.letzterKey, "");
    localStorage.setItem(cfg.gesamtKey, String(Math.max(0, gesamt - 1)));
  }
}

// Gefüllte Flamme (kein Strich-Icon), Grösse variabel - genutzt für die
// Kachel-Ansicht im Menü (gross für Tag, kleiner für Woche/Monat).
function flammeSvg(groesse) {
  return `<svg width="${groesse}" height="${groesse}" viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd">
    <path d="M12.5 2.2c1.3 2.8-.7 4.6-2.4 6.8-1.9 2.5-3.4 4.6-3.4 7.3a5.3 5.3 0 0 0 10.6.4c.1-1.8-.5-3.2-1.2-4.4.6 2.3-.7 3.6-2.1 3.4 1.3-2.1.1-4-1-5.3-.2 2-1.6 2.8-1.4 4.6-1.5-1.4-2-3.6-.8-5.7.9-1.6 2.4-3.7 1.7-7.1z
    M12.3 13c-.9 1.1-1.6 2.2-1.6 3.6 0 1.7 1.3 2.9 2.9 2.7 1.4-.2 2.4-1.5 2.2-2.9-.1-.7-.4-1.3-.8-1.8.2 1.1-.5 1.8-1.3 1.7.6-1.3-.2-2.3-1-2.9.1.9-.6 1.4-.4 2.2-.7-.7-1.1-1.7-.1-2.6z"></path>
  </svg>`;
}

function oeffneFlaemmchenPopup() {
  document.getElementById("flaemmchen-popup").style.display = "block";
  localStorage.setItem(`dayguide_flaemmchen_gesehen_${heuteStr()}`, "1");
  document.getElementById("section-flaemmchen-preview").style.display = "none";
}
function schliesseFlaemmchenPopup() {
  document.getElementById("flaemmchen-popup").style.display = "none";
}

// Inhalt neu berechnen (Aufgaben-Texte, Streaks, Vorschau-Sichtbarkeit) - sicher
// beliebig oft aufrufbar, hängt KEINE Event-Listener an. Wichtig für den
// Seiten-Refresh bei visibilitychange (siehe aktualisiereInhalt() unten):
// Tageswechsel im Hintergrund (App auf dem iPhone lange nicht angeschaut) soll
// hierüber nachgezogen werden, ohne setupFlaemmchen() nochmal aufzurufen
// (das würde alle Klick-Listener doppelt anhängen).
function aktualisiereFlaemmchenInhalt() {
  const badge = document.getElementById("flaemmchen-streak-badge");
  const streakText = document.getElementById("flaemmchen-streak-text");
  const previewSection = document.getElementById("section-flaemmchen-preview");
  const previewText = document.getElementById("flaemmchen-preview-text");
  const previewStreak = document.getElementById("flaemmchen-preview-streak");

  const aufgabenText = { tag: heutigeFlaemmchenAufgabe(), woche: wochenFlaemmchenAufgabe(), monat: monatsFlaemmchenAufgabe() };
  document.getElementById("flaemmchen-heute-text").textContent = aufgabenText.tag;
  document.getElementById("flaemmchen-woche-text").textContent = aufgabenText.woche;
  document.getElementById("flaemmchen-monat-text").textContent = aufgabenText.monat;

  const checkboxen = {
    tag: document.getElementById("flaemmchen-tag-checkbox"),
    woche: document.getElementById("flaemmchen-woche-checkbox"),
    monat: document.getElementById("flaemmchen-monat-checkbox"),
  };
  const streakLabels = {
    tag: document.getElementById("flaemmchen-tag-streak"),
    woche: document.getElementById("flaemmchen-woche-streak"),
    monat: document.getElementById("flaemmchen-monat-streak"),
  };

  ["tag", "woche", "monat"].forEach(einheit => {
    const cfg = FLAEMMCHEN_EINHEITEN[einheit];
    checkboxen[einheit].checked = localStorage.getItem(cfg.letzterKey) === cfg.aktuellerSchluessel();
    const streak = flaemmchenAngezeigterStreak(einheit);
    streakLabels[einheit].textContent = streak > 0 ? `· ${streak}` : "";
  });

  const tagesStreak = flaemmchenAngezeigterStreak("tag");
  badge.textContent = tagesStreak > 0 ? String(tagesStreak) : "";
  streakText.textContent = tagesStreak === 1 ? "1 Tag Streak" : `${tagesStreak} Tage Streak`;
  previewStreak.textContent = tagesStreak > 0 ? ` · ${tagesStreak} Tage Streak` : "";

  // Vorschau auf der Hauptseite: einmal pro Tag offen, danach nur noch das Icon
  // (gleiches Prinzip wie Wetter/News, die sich nach dem ersten Anschauen reduzieren)
  const gesehenKey = `dayguide_flaemmchen_gesehen_${heuteStr()}`;
  if (!localStorage.getItem(gesehenKey)) {
    previewText.textContent = aufgabenText.tag;
    previewSection.style.display = "";
  } else {
    previewSection.style.display = "none";
  }
}

function setupFlaemmchen() {
  const btn = document.getElementById("flaemmchen-btn");
  const popup = document.getElementById("flaemmchen-popup");
  const closeBtn = document.getElementById("flaemmchen-close");
  const previewSection = document.getElementById("section-flaemmchen-preview");
  const checkboxen = {
    tag: document.getElementById("flaemmchen-tag-checkbox"),
    woche: document.getElementById("flaemmchen-woche-checkbox"),
    monat: document.getElementById("flaemmchen-monat-checkbox"),
  };

  aktualisiereFlaemmchenInhalt();

  ["tag", "woche", "monat"].forEach(einheit => {
    checkboxen[einheit].addEventListener("change", () => {
      flaemmchenUmschalten(einheit, checkboxen[einheit].checked);
      aktualisiereFlaemmchenInhalt();
    });
  });

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    popup.style.display === "block" ? schliesseFlaemmchenPopup() : oeffneFlaemmchenPopup();
  });
  previewSection.addEventListener("click", oeffneFlaemmchenPopup);
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    schliesseFlaemmchenPopup();
  });
  document.addEventListener("click", (e) => {
    if (popup.style.display !== "none" && !popup.contains(e.target) && e.target !== btn) {
      schliesseFlaemmchenPopup();
    }
  });
}

// --- Menü-Ansicht "Flämmchen": Übersicht + Fakten (aktuelle Streak, Rekord,
// insgesamt erledigt je Einheit) als Kacheln - eine grosse oben für den Tag,
// zwei kleinere darunter nebeneinander für Woche/Monat. Abhaken selbst
// passiert weiterhin nur im Popup (Flammen-Icon oben rechts) - hier bewusst
// nur eine Übersicht, damit keine zweiten Checkboxen mit denselben IDs
// entstehen. ---
function flaemmchenKachelHtml(einheit, label, groesse) {
  const cfg = FLAEMMCHEN_EINHEITEN[einheit];
  const aufgabenText = { tag: heutigeFlaemmchenAufgabe, woche: wochenFlaemmchenAufgabe, monat: monatsFlaemmchenAufgabe }[einheit]();
  const streak = flaemmchenAngezeigterStreak(einheit);
  const rekord = parseInt(localStorage.getItem(cfg.rekordKey) || "0", 10);
  const gesamt = parseInt(localStorage.getItem(cfg.gesamtKey) || "0", 10);

  return `
    <div class="flaemmchen-kachel">
      <div class="flaemmchen-kachel-icon">${flammeSvg(groesse)}</div>
      <div class="flaemmchen-label">${label}</div>
      <div class="flaemmchen-kachel-text">${aufgabenText}</div>
      <div class="flaemmchen-fakten-row"><span>Aktuelle Streak</span><span>${streak}</span></div>
      <div class="flaemmchen-fakten-row"><span>Rekord</span><span>${rekord}</span></div>
      <div class="flaemmchen-fakten-row"><span>Insgesamt erledigt</span><span>${gesamt}</span></div>
    </div>`;
}

function renderFlaemmchenDetail() {
  const html = `
    <div class="flaemmchen-kacheln">
      ${flaemmchenKachelHtml("tag", "Heute", 40)}
      <div class="flaemmchen-kachel-reihe">
        ${flaemmchenKachelHtml("woche", "Diese Woche", 22)}
        ${flaemmchenKachelHtml("monat", "Diesen Monat", 22)}
      </div>
    </div>
    <div class="flaemmchen-hinweis">Zum Abhaken oben rechts aufs Flammen-Symbol tippen.</div>`;

  document.getElementById("flaemmchen-menu-content").innerHTML = html;
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
  if (localStorage.getItem("dayguide_ferienmodus") === "1") return "wochenende";
  if (istWochenende()) return "wochenende";

  const lektionen = getHeutigeLektionen();
  if (lektionen.length === 0) return "keineLektionen";

  const now = new Date();
  const ersterStart = zeitHeuteAls(lektionen[0].time);
  const letzte = lektionen[lektionen.length - 1];
  const letztesEnde = zeitHeuteAls(letzte.end || letzte.time);
  const heimwegSchwelle = new Date(letztesEnde.getTime() - HEIMWEG_VORLAUF_MIN * 60000);

  if (now < ersterStart) return "vor";
  if (now >= heimwegSchwelle) {
    const heimwegEndeMs = letztesEnde.getTime() + HEIMWEG_FENSTER_MIN * 60000;
    if (now.getTime() > heimwegEndeMs) return "abend"; // vermutlich längst zuhause
    return "heimweg";
  }
  return "unterricht";
}

// --- Steuert, welche Bus-Ansicht gezeigt wird: Hinweg, ausgeblendet (Unterricht) oder Heimweg ---
// Ab dieser Breite gilt die Desktop-Ansicht (siehe Media Query in index.html).
// Tim nutzt den PC laut eigener Aussage erst während/gegen Ende der Schule,
// nicht morgens davor - daher dort keine Morgenroutine/Hinweg-Bus, aber der
// Heimweg-Bus bleibt (kurz vor Schulschluss evtl. noch relevant).
function istDesktopBreite() {
  return window.matchMedia("(min-width: 900px)").matches;
}

function handleBusSection(phase) {
  const bus = document.getElementById("section-bus");
  const label = document.getElementById("bus-label");

  if ((phase === "vor" || phase === "keineLektionen") && !istDesktopBreite()) {
    bus.style.display = "";
    label.innerHTML = `${BUS_ICON_SVG} Weg zur Kanti <span class="live-dot"></span>`;
    loadBusHinweg();
  } else if (phase === "heimweg") {
    bus.style.display = "";
    label.innerHTML = `${BUS_ICON_SVG} Heimweg <span class="live-dot"></span>`;
    loadBusHeimweg();
  } else {
    // wochenende, unterricht oder abend (Heimweg-Fenster vorbei): Bus ausblenden
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
  const news = document.getElementById("section-news");
  const morgenroutine = document.getElementById("section-morgenroutine");
  const packliste = document.getElementById("section-packliste");
  const abendroutine = document.getElementById("section-abendroutine");
  const wrap = wetter.parentElement;

  // Grundzustand, wird unten je nach Phase wieder angepasst
  nextlesson.style.display = "none";
  lessons.style.display = "";
  bus.style.display = "";
  morgenroutine.style.display = "none";
  packliste.style.display = "none";
  abendroutine.style.display = "none";

  if (phase === "wochenende") {
    bus.style.display = "none";
    lessons.style.display = "none";
    wrap.append(wetter, exams, news);
    wetter.classList.remove("compact");
    exams.classList.remove("compact");
    return;
  }

  if (phase === "unterricht") {
    bus.style.display = "none";
    nextlesson.style.display = "";
    wrap.append(nextlesson, lessons, wetter, exams, news);
    lessons.classList.remove("compact");
    wetter.classList.add("compact");
    exams.classList.add("compact");
    return;
  }

  if (phase === "heimweg") {
    lessons.style.display = "none";
    if (istPacklisteZeit()) {
      packliste.style.display = "";
      renderPackliste();
      abendroutine.style.display = "";
      renderAbendroutine();
    }
    wrap.append(bus, packliste, abendroutine, wetter, exams, news);
    bus.classList.remove("compact");
    wetter.classList.add("compact");
    exams.classList.add("compact");
    return;
  }

  if (phase === "abend") {
    bus.style.display = "none";
    lessons.style.display = "none";
    if (istPacklisteZeit()) {
      packliste.style.display = "";
      renderPackliste();
      abendroutine.style.display = "";
      renderAbendroutine();
    }
    wrap.append(packliste, abendroutine, wetter, exams, news);
    wetter.classList.remove("compact");
    exams.classList.remove("compact");
    return;
  }

  // Phase "vor" oder "keineLektionen"
  const hour = new Date().getHours();
  const istMorgen = hour < 13;

  if (phase === "vor" && !istDesktopBreite()) {
    morgenroutine.style.display = "";
    renderMorgenroutine();
  }

  if (istMorgen) {
    wrap.append(morgenroutine, wetter, bus, lessons, exams, news);
    wetter.classList.remove("compact");
    bus.classList.remove("compact");
    lessons.classList.add("compact");
    exams.classList.add("compact");
  } else {
    wrap.append(lessons, exams, wetter, bus, news);
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
  if (hour >= 11 && hour < 13) greeting = "Guten Appetit";
  else if (hour >= 13 && hour < 18) greeting = "Guten Tag";
  else if (hour >= 18) greeting = "Guten Abend";
  document.getElementById("greeting").textContent = `${greeting} ${USER_NAME}`;

  const dateStr = now.toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long" });
  document.getElementById("today-date").textContent = dateStr;
}

// --- Wetter (Open-Meteo, kein API-Key nötig) ---
async function loadWeather() {
  const el = document.getElementById("weather-content");
  const label = document.getElementById("weather-label");
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LOCATION.lat}&longitude=${WEATHER_LOCATION.lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FZurich&forecast_days=8`;
    const res = await fetch(url);
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const desc = weatherCodeToText(data.current.weather_code);
    const naechsteStunde = getNaechsteStundeText(data);

    // Erstes Mal in diesem Zeitfenster (morgen/mittag) -> offen,
    // danach komplett reduziert auf das Wort "Wetter"
    const aktuellerSlot = getNewsSlot();
    const heute = heuteStr();
    const gesehenKey = `dayguide_wetter_gesehen_${heute}_${aktuellerSlot}`;
    let offen = !localStorage.getItem(gesehenKey);
    localStorage.setItem(gesehenKey, "1");

    const vollHtml = `
      <div class="weather-row">
        <span class="weather-temp">${temp}°</span>
        <span class="weather-desc">${desc} · ${WEATHER_LOCATION.name}</span>
      </div>
      ${naechsteStunde ? `<div class="weather-desc" style="margin-top:2px;">Nächste Stunde: ${naechsteStunde}</div>` : ""}
      <div class="toggle-hint">Mehr Prognose</div>
      <div class="expanded" style="display:none;"></div>`;

    function render() {
      el.className = "";
      el.innerHTML = offen ? vollHtml : "";
      label.innerHTML = `Wetter ${temp}° <span class="live-dot"></span>`;
      if (offen) wireWeatherToggles(data);
    }
    render();

    label.classList.add("clickable");
    label.addEventListener("click", () => {
      offen = !offen;
      render();
    });
  } catch (err) {
    el.className = "error";
    el.innerHTML = `Wetter konnte nicht geladen werden. <span class="retry-link" onclick="loadWeather()">Nochmal versuchen</span>`;
  }
}

// --- Verknüpft die Klick-Bereiche innerhalb der Wetter-Vollansicht ---
function wireWeatherToggles(data) {
  const el = document.getElementById("weather-content");
  const hint = el.querySelector(".toggle-hint");
  const panel = el.querySelector(".expanded");
  hint.addEventListener("click", (e) => {
    e.stopPropagation();
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
}

// --- Hilfsfunktion: Datum/Zeit-Strings von Open-Meteo (ohne Zeitzone) sicher
// als LOKALE Zeit parsen. new Date(string) bzw. toISOString() würden UTC
// verwenden und je nach Zeitzone/Browser falsche Ergebnisse liefern. ---
function parseLocalDateTime(str) {
  const [datum, zeit] = str.split("T");
  const [jahr, monat, tag] = datum.split("-").map(Number);
  const [stunde, minute] = (zeit || "0:0").split(":").map(Number);
  return new Date(jahr, monat - 1, tag, stunde, minute);
}

function getNaechsteStundeText(data) {
  const ziel = new Date();
  ziel.setHours(ziel.getHours() + 1, 0, 0, 0);
  const jahr = ziel.getFullYear();
  const monat = String(ziel.getMonth() + 1).padStart(2, "0");
  const tag = String(ziel.getDate()).padStart(2, "0");
  const stunde = String(ziel.getHours()).padStart(2, "0");
  const praefix = `${jahr}-${monat}-${tag}T${stunde}`;
  const idx = data.hourly.time.findIndex(t => t.startsWith(praefix));
  if (idx === -1) return null;
  return weatherCodeToText(data.hourly.weather_code[idx]);
}

function buildWeatherForecastHtml(data) {
  const now = new Date();
  const heuteLokal = heuteStr();

  // Rest des Tages: stündlich, alle 3 Stunden, ab jetzt bis Mitternacht
  const restHtml = data.hourly.time
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.startsWith(heuteLokal) && parseLocalDateTime(t) > now)
    .filter((_, idx) => idx % 3 === 0)
    .map(({ t, i }) => {
      const stunde = parseLocalDateTime(t).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
      const temp = Math.round(data.hourly.temperature_2m[i]);
      return `<div class="hourly-row"><span>${stunde}</span><span>${temp}°</span></div>`;
    }).join("");

  // Nächste 7 Tage (Index 0 = heute, also ab 1)
  const tageHtml = data.daily.time.slice(1, 8).map((datum, idx) => {
    const i = idx + 1;
    const tag = parseLocalDateTime(datum).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "numeric" });
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
    const [h1, m1] = zeit1.split(":").map(Number);
    const abfahrt1 = new Date();
    abfahrt1.setHours(h1, m1, 0, 0);
    const ankunft1 = new Date(abfahrt1.getTime() + REISEZEIT_ETAPPE1_MIN * 60000);
    const ankunft1Str = ankunft1.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
    const losfahren = new Date(abfahrt1.getTime() - ZEIT_ZUHAUSE_HALTESTELLE_MIN * 60000);
    const losfahrenStr = losfahren.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });

    html += `
      <div class="board-row">
        <span class="board-route">Kirchberg Post → Wil Bahnhof</span>
        <span class="board-time">${zeit1} → ${ankunft1Str}</span>
      </div>
      <div class="board-row">
        <span class="board-route">Losfahren spätestens</span>
        <span class="board-time">${losfahrenStr}</span>
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

    // Empfehlung: Bus, solange Wartezeit innerhalb der Toleranz liegt
    let empfehlung;
    if (wartezeitMin <= WARTETOLERANZ_MIN) {
      empfehlung = wartezeitMin <= GEHZEIT_BAHNHOF_KANTI
        ? `Bus nehmen – du sparst ca. ${GEHZEIT_BAHNHOF_KANTI - wartezeitMin} Min. gegenüber Laufen.`
        : `Bus nehmen – ${wartezeitMin} Min. warten ist noch ok.`;
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
      if (wartezeitMin <= WARTETOLERANZ_MIN) {
        empfehlung = wartezeitMin <= GEHZEIT_BAHNHOF_KANTI
          ? `Bus nehmen – du sparst ca. ${GEHZEIT_BAHNHOF_KANTI - wartezeitMin} Min. gegenüber Laufen.`
          : `Bus nehmen – ${wartezeitMin} Min. warten ist noch ok.`;
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
          <span class="board-route">Kanti → Wil Bahnhof</span>
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
    const ankunft = new Date(abfahrtPlan.getTime() + REISEZEIT_ETAPPE1_MIN * 60000);
    const ankunftStr = ankunft.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });

    slot.outerHTML = `
      <div class="board-row">
        <span class="board-route">Wil Bahnhof → Kirchberg Post</span>
        <span class="board-time">${abfahrtPlan.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} → ${ankunftStr}
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

// --- Generische Checkliste mit Tages-Speicherung im Browser ---
function renderChecklist(containerId, storageKeyPrefix, items, onChange) {
  const container = document.getElementById(containerId);
  const heute = heuteStr();

  container.innerHTML = items.map((item, i) => {
    const key = `${storageKeyPrefix}_${heute}_${i}`;
    const checked = localStorage.getItem(key) === "1";
    return `
      <label class="checklist-row${checked ? " done" : ""}">
        <input type="checkbox" data-key="${key}" ${checked ? "checked" : ""}>
        <span>${item}</span>
      </label>`;
  }).join("");

  container.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", () => {
      localStorage.setItem(cb.dataset.key, cb.checked ? "1" : "0");
      cb.closest(".checklist-row").classList.toggle("done", cb.checked);
      if (onChange) onChange();
    });
  });
}

// --- Listen-Editor: Morgenroutine/Packliste/Abendroutine direkt in der App
// bearbeitbar (nicht mehr nur über data.js). data.js bleibt die Werkseinstellung
// - beim allerersten Aufruf wird sie nach localStorage kopiert, danach zählt
// nur noch, was dort gespeichert ist. ---
const LISTEN_KONFIG = {
  morgenroutine: { key: "dayguide_liste_morgenroutine", standard: MORGENROUTINE, label: "Morgenroutine" },
  packliste_schule: { key: "dayguide_liste_packliste_schule", standard: PACKLISTE_SCHULE, label: "Packliste (Schule)" },
  packliste_sport: { key: "dayguide_liste_packliste_sport", standard: PACKLISTE_SPORT, label: "Packliste (Sport)" },
  abendroutine: { key: "dayguide_liste_abendroutine", standard: ABENDROUTINE, label: "Abendroutine" },
};

function ladeListe(cfg) {
  const raw = localStorage.getItem(cfg.key);
  if (!raw) return [...cfg.standard];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [...cfg.standard];
  } catch (e) {
    return [...cfg.standard];
  }
}
function speichereListe(cfg, arr) {
  localStorage.setItem(cfg.key, JSON.stringify(arr));
}

let aktuelleListe = "morgenroutine";

function renderListenEditor() {
  const cfg = LISTEN_KONFIG[aktuelleListe];
  const items = ladeListe(cfg);
  const content = document.getElementById("listen-content");

  document.querySelectorAll(".listen-tab").forEach(tab => {
    tab.classList.toggle("aktiv", tab.dataset.liste === aktuelleListe);
  });

  content.innerHTML = items.length === 0
    ? `<div class="empty">Keine Einträge.</div>`
    : items.map((text, i) => `
      <label class="checklist-row todo-row">
        <span style="flex:1;">${text}</span>
        <span class="todo-delete" data-i="${i}">✕</span>
      </label>`).join("");

  content.querySelectorAll(".todo-delete").forEach(el => {
    el.addEventListener("click", () => {
      const arr = ladeListe(cfg);
      arr.splice(Number(el.dataset.i), 1);
      speichereListe(cfg, arr);
      renderListenEditor();
    });
  });
}

function setupListenEditor() {
  document.querySelectorAll(".listen-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      aktuelleListe = tab.dataset.liste;
      renderListenEditor();
    });
  });

  const input = document.getElementById("listen-input");
  const btn = document.getElementById("listen-add-btn");
  function hinzufuegen() {
    const text = input.value.trim();
    if (!text) return;
    const cfg = LISTEN_KONFIG[aktuelleListe];
    const arr = ladeListe(cfg);
    arr.push(text);
    speichereListe(cfg, arr);
    input.value = "";
    renderListenEditor();
  }
  btn.addEventListener("click", hinzufuegen);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") hinzufuegen(); });
}

function renderMorgenroutine() {
  renderChecklist("morgenroutine-content", "dayguide_morgenroutine", ladeListe(LISTEN_KONFIG.morgenroutine));

  const weekday = new Date().getDay();
  const zeit1 = ETAPPE1_FAHRPLAN[weekday];
  if (zeit1) {
    const [h, m] = zeit1.split(":").map(Number);
    const abfahrt = new Date();
    abfahrt.setHours(h, m, 0, 0);
    const losfahren = new Date(abfahrt.getTime() - ZEIT_ZUHAUSE_HALTESTELLE_MIN * 60000);
    const losfahrenStr = losfahren.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
    // insertAdjacentHTML statt innerHTML += : Letzteres würde die eben von
    // renderChecklist gesetzten Checkbox-Listener zerstören (innerHTML +=
    // baut ALLE Kind-Elemente neu auf, auch die schon vorhandenen).
    const el = document.getElementById("morgenroutine-content");
    el.insertAdjacentHTML("beforeend", `
      <div class="lesson-row" style="margin-top:6px;">
        <span class="lesson-time">→</span>
        <span>Losfahren spätestens ${losfahrenStr}</span>
      </div>`);
  }
}

function istPacklisteZeit() {
  const now = new Date();
  const stunden = now.getHours() + now.getMinutes() / 60;
  return stunden >= PACKLISTE_AB_STUNDE;
}

function renderPackliste() {
  const morgen = new Date();
  morgen.setDate(morgen.getDate() + 1);
  const morgenWeekday = morgen.getDay();

  let items = ladeListe(LISTEN_KONFIG.packliste_schule);
  if (istSchulsporttag(morgenWeekday) || istPersoenlicherSporttag(morgenWeekday)) {
    items = items.concat(ladeListe(LISTEN_KONFIG.packliste_sport));
  }

  function pruefeVollstaendig() {
    const heute = heuteStr();
    const alleErledigt = items.every((_, i) => localStorage.getItem(`dayguide_packliste_${heute}_${i}`) === "1");
    document.getElementById("section-packliste").style.display = alleErledigt ? "none" : "";
  }

  renderChecklist("packliste-content", "dayguide_packliste", items, pruefeVollstaendig);
  pruefeVollstaendig();
}

function renderAbendroutine() {
  const items = ladeListe(LISTEN_KONFIG.abendroutine);

  function pruefeVollstaendig() {
    const heute = heuteStr();
    const alleErledigt = items.every((_, i) => localStorage.getItem(`dayguide_abendroutine_${heute}_${i}`) === "1");
    document.getElementById("section-abendroutine").style.display = alleErledigt ? "none" : "";
  }

  renderChecklist("abendroutine-content", "dayguide_abendroutine", items, pruefeVollstaendig);
  pruefeVollstaendig();
}
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
  const d = new Date();
  const jahr = d.getFullYear();
  const monat = String(d.getMonth() + 1).padStart(2, "0");
  const tag = String(d.getDate()).padStart(2, "0");
  return `${jahr}-${monat}-${tag}`;
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
  const label = document.getElementById("news-label");

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

  let offen = erstesMal;

  function render() {
    el.className = "";
    el.innerHTML = offen ? listHtml : "";
  }
  render();

  label.classList.add("clickable");
  label.addEventListener("click", () => {
    offen = !offen;
    render();
  });
}

init();

// --- "Schule"-Untermenü: Morgiger Stundenplan / Hausaufgaben / Lernplan.
// Eigene kleine Liste-zu-Detail-Navigation innerhalb von detail-schule, analog
// zum äusseren Menü-Muster (Liste <-> Detail mit "‹ Zurück"). Der äussere
// "‹ Zurück"-Button geht immer bis zur Hauptliste zurück (wie überall sonst
// auch) - dieser innere Zurück-Button geht nur auf die Schule-Liste zurück. ---
function zeigeSchuleListe() {
  document.getElementById("schule-liste").style.display = "block";
  document.getElementById("schule-detail").style.display = "none";
}

function zeigeSchuleDetail(view) {
  document.getElementById("schule-liste").style.display = "none";
  document.getElementById("schule-detail").style.display = "block";
  document.querySelectorAll("#schule-detail > div[id^='schule-']").forEach(d => d.style.display = "none");
  document.getElementById(`schule-${view}`).style.display = "block";
  if (view === "stundenplan") renderMorgenStundenplan();
  if (view === "hausaufgaben") renderHausaufgabenListe();
  if (view === "lernplan") renderLernplanListe();
}

function setupSchuleMenu() {
  document.getElementById("schule-back").addEventListener("click", zeigeSchuleListe);
  document.querySelectorAll("#schule-liste .menu-list-item").forEach(item => {
    item.addEventListener("click", () => zeigeSchuleDetail(item.dataset.schuleView));
  });

  setupHausaufgabenManager();
  setupLernplanManager();

  // Schnellzugriff (nur Hausaufgaben, siehe Tims Wunsch): Menü öffnen und
  // direkt ins Formular springen, ohne über die Schule-Liste zu gehen.
  document.getElementById("hausaufgaben-shortcut-btn").addEventListener("click", () => {
    document.getElementById("menu-overlay").classList.add("open");
    document.getElementById("menu-list").style.display = "none";
    document.getElementById("menu-detail").style.display = "block";
    document.querySelectorAll("#menu-detail > div[id^='detail-']").forEach(d => d.style.display = "none");
    document.getElementById("detail-schule").style.display = "block";
    zeigeSchuleDetail("hausaufgaben");
  });
}

// Alle im Stundenplan vorkommenden Fächer, für die Fach-Auswahl in den Formularen.
function alleFaecher() {
  return [...new Set(STUNDENPLAN.map(l => l.subject))].sort();
}

// Nächste anstehende Prüfung, deren Fach-Kürzel mit dem gewählten Fach beginnt.
function naechstePruefungFuerFach(fach) {
  const heute = heuteStr();
  return PRUEFUNGEN
    .filter(p => p.date >= heute && p.subject.startsWith(fach))
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
}

function formatDatumKurz(datumStr) {
  const [j, m, t] = datumStr.split("-").map(Number);
  return new Date(j, m - 1, t).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" });
}

function todoHinzufuegenMitFolder(text, folder, due) {
  const todos = ladeTodos();
  todos.push({ text, done: false, folder, due: due || null });
  speichereTodos(todos);
}

// Hängt einen Zusatztext an die Kalender-Notiz des angegebenen Tages an
// (bestehender Text bleibt erhalten, neue Zeile darunter).
function kalenderNotizErgaenzen(datumStr, zusatzText) {
  const notizen = ladeKalenderNotizen();
  const bisher = notizen[datumStr] || "";
  notizen[datumStr] = bisher ? `${bisher}\n${zusatzText}` : zusatzText;
  speichereKalenderNotizen(notizen);
}

// --- Hausaufgabenmanager: Fach -> Seiten-von-bis ODER freie Notiz -> Datum.
// Landet als To-Do (folder "hausaufgaben") und als Kalender-Notiz am Fälligkeitstag. ---
let haArt = "seiten";

function setupHausaufgabenManager() {
  const fachSelect = document.getElementById("ha-fach");
  fachSelect.innerHTML = alleFaecher().map(f => `<option value="${f}">${f}</option>`).join("");

  document.querySelectorAll("#schule-hausaufgaben .listen-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      haArt = tab.dataset.art;
      document.querySelectorAll("#schule-hausaufgaben .listen-tab").forEach(t => t.classList.toggle("aktiv", t === tab));
      document.getElementById("ha-seiten-felder").style.display = haArt === "seiten" ? "flex" : "none";
      document.getElementById("ha-notiz-text").style.display = haArt === "notiz" ? "block" : "none";
    });
  });

  document.getElementById("ha-submit").addEventListener("click", () => {
    const fach = fachSelect.value;
    const datum = document.getElementById("ha-datum").value;
    if (!fach || !datum) return;

    let beschreibung;
    if (haArt === "seiten") {
      const von = document.getElementById("ha-seite-von").value;
      const bis = document.getElementById("ha-seite-bis").value;
      if (!von || !bis) return;
      beschreibung = `${fach}: Seite ${von}–${bis}`;
    } else {
      const text = document.getElementById("ha-notiz-text").value.trim();
      if (!text) return;
      beschreibung = `${fach}: ${text}`;
    }

    todoHinzufuegenMitFolder(beschreibung, "hausaufgaben", datum);
    kalenderNotizErgaenzen(datum, `Hausaufgabe ${beschreibung}`);
    renderKalenderWidget();

    document.getElementById("ha-seite-von").value = "";
    document.getElementById("ha-seite-bis").value = "";
    document.getElementById("ha-notiz-text").value = "";
    document.getElementById("ha-datum").value = "";
    renderHausaufgabenListe();
    renderTodo();
  });
}

// Gemeinsame Render-Funktion für die Hausaufgaben-/Lernplan-Übersicht -
// mit echter, klickbarer Checkbox (Tim wollte hier direkt abhaken können,
// nicht nur über die To-Do-Liste). Index wieder über Objekt-Referenz, wie
// in renderTodo() - siehe Kommentar dort.
function renderFolderListe(containerId, folder, leerText, nurOffene = false) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const todos = ladeTodos();
  let eintraege = todos.filter(t => t.folder === folder);
  if (nurOffene) eintraege = eintraege.filter(t => !t.done);

  el.innerHTML = eintraege.length === 0
    ? `<div class="empty">${leerText}</div>`
    : eintraege.map(t => {
      const i = todos.indexOf(t);
      return `
        <label class="checklist-row todo-row${t.done ? " done" : ""}">
          <input type="checkbox" data-i="${i}">
          <span style="flex:1;">${t.text}</span>
          <span class="lesson-time">${t.due ? formatDatumKurz(t.due) : ""}</span>
        </label>`;
    }).join("");

  el.querySelectorAll("input[type=checkbox]").forEach(cb => {
    if (todos[cb.dataset.i].done) cb.checked = true;
    cb.addEventListener("change", () => {
      const aktuelleTodos = ladeTodos();
      aktuelleTodos[cb.dataset.i].done = cb.checked;
      speichereTodos(aktuelleTodos);
      renderFolderListe(containerId, folder, leerText, nurOffene);
      renderTodo();
    });
  });
}

function renderHausaufgabenListe() {
  renderFolderListe("hausaufgaben-liste", "hausaufgaben", "Keine Hausaufgaben eingetragen.");
}

// --- Lernplanmanager: Fach -> was lernen -> Datum, zeigt zusätzlich die
// nächste Prüfung in diesem Fach an. Landet als To-Do (folder "lernplan")
// und als Kalender-Notiz. ---
function setupLernplanManager() {
  const fachSelect = document.getElementById("lp-fach");
  fachSelect.innerHTML = alleFaecher().map(f => `<option value="${f}">${f}</option>`).join("");

  function aktualisierePruefungsHinweis() {
    const naechste = naechstePruefungFuerFach(fachSelect.value);
    document.getElementById("lp-pruefung-hinweis").textContent = naechste
      ? `Nächste Prüfung in diesem Fach: ${formatDatumKurz(naechste.date)} – ${naechste.subject}`
      : "Keine anstehende Prüfung in diesem Fach gefunden.";
  }
  fachSelect.addEventListener("change", aktualisierePruefungsHinweis);
  aktualisierePruefungsHinweis();

  document.getElementById("lp-submit").addEventListener("click", () => {
    const fach = fachSelect.value;
    const was = document.getElementById("lp-text").value.trim();
    const datum = document.getElementById("lp-datum").value;
    if (!fach || !was || !datum) return;

    const beschreibung = `${fach}: ${was}`;
    todoHinzufuegenMitFolder(beschreibung, "lernplan", datum);
    kalenderNotizErgaenzen(datum, `Lernplan ${beschreibung}`);
    renderKalenderWidget();

    document.getElementById("lp-text").value = "";
    document.getElementById("lp-datum").value = "";
    renderLernplanListe();
    renderTodo();
  });
}

function renderLernplanListe() {
  renderFolderListe("lernplan-liste", "lernplan", "Kein Lernplan eingetragen.");
}

// --- Desktop-Widget (siehe Media Query in index.html, nur ab 900px sichtbar):
// offene Hausaufgaben direkt auf der Hauptseite, ohne ins Menü zu müssen -
// Tim nutzt den Hausaufgabenmanager öfter am PC als am Handy. ---
function renderHausaufgabenWidget() {
  renderFolderListe("hausaufgaben-widget-content", "hausaufgaben", "Keine offenen Hausaufgaben.", true);
}

// --- Morgen-Erinnerung: fällige/überfällige, noch nicht erledigte Hausaufgaben.
// Nur in Phase "vor" (siehe Tims Wunsch: "am Morgen davor sehen"). ---
function handleHausaufgabenErinnerung(phase) {
  const el = document.getElementById("section-hausaufgaben-erinnerung");
  if (phase !== "vor") {
    el.style.display = "none";
    return;
  }
  const heute = heuteStr();
  const offene = ladeTodos().filter(t => t.folder === "hausaufgaben" && !t.done && t.due && t.due <= heute);

  if (offene.length === 0) {
    el.style.display = "none";
    return;
  }
  document.getElementById("hausaufgaben-erinnerung-content").innerHTML =
    offene.map(t => `<div class="lesson-row"><span>${t.text}</span></div>`).join("");
  el.style.display = "";
}

// --- Menü: Button öffnet Overlay mit morgigem Stundenplan ---
function setupMenu() {
  const btn = document.getElementById("menu-btn");
  const overlay = document.getElementById("menu-overlay");
  const closeBtn = document.getElementById("menu-close");
  const list = document.getElementById("menu-list");
  const detail = document.getElementById("menu-detail");
  const backBtn = document.getElementById("menu-back");

  function zeigeListe() {
    list.style.display = "block";
    detail.style.display = "none";
  }

  btn.addEventListener("click", () => {
    zeigeListe();
    overlay.classList.add("open");
  });
  closeBtn.addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });
  backBtn.addEventListener("click", zeigeListe);

  document.querySelectorAll(".menu-list-item").forEach(item => {
    item.addEventListener("click", () => {
      const view = item.dataset.view;
      list.style.display = "none";
      detail.style.display = "block";
      document.querySelectorAll("#menu-detail > div[id^='detail-']").forEach(d => d.style.display = "none");
      document.getElementById(`detail-${view}`).style.display = "block";
      if (view === "schule") zeigeSchuleListe();
      if (view === "wochenplan") renderWochenplan();
      if (view === "todo") renderTodo();
      if (view === "kalender") renderKalender();
      if (view === "flaemmchen") renderFlaemmchenDetail();
      if (view === "listen") renderListenEditor();
    });
  });

  setupSchuleMenu();
  setupTodoInput();
  setupKalenderPopup();
  setupListenEditor();

  const ferienToggle = document.getElementById("ferienmodus-toggle");
  ferienToggle.checked = localStorage.getItem("dayguide_ferienmodus") === "1";
  ferienToggle.addEventListener("change", () => {
    localStorage.setItem("dayguide_ferienmodus", ferienToggle.checked ? "1" : "0");
    location.reload();
  });

  setupTheme();
}

// --- Heller/Dunkler Modus: Standard ist dunkel (kein Attribut nötig dafür).
// Wird zusätzlich ganz früh im <head> per Inline-Script gesetzt, damit beim
// Laden nicht kurz der dunkle Look aufblitzt, bevor auf hell umgeschaltet wird. ---
function setupTheme() {
  const toggle = document.getElementById("theme-toggle");
  const metaTheme = document.getElementById("theme-color-meta");
  const hell = localStorage.getItem("dayguide_theme") === "light";
  toggle.checked = hell;

  toggle.addEventListener("change", () => {
    const neuHell = toggle.checked;
    document.documentElement.setAttribute("data-theme", neuHell ? "light" : "dark");
    localStorage.setItem("dayguide_theme", neuHell ? "light" : "dark");
    if (metaTheme) metaTheme.setAttribute("content", neuHell ? "#ffffff" : "#000000");
  });
}

// --- Menü per Wisch-Geste öffnen/schliessen: nach links wischen öffnet,
// nach rechts wischen schliesst - unabhängig davon, ob es schon offen ist. ---
function setupSwipeMenu() {
  const overlay = document.getElementById("menu-overlay");
  let startX = 0, startY = 0, tracking = false;

  document.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) {
      tracking = false;
      return;
    }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;
    const deltaX = e.changedTouches[0].clientX - startX;
    const deltaY = e.changedTouches[0].clientY - startY;

    // Nur eindeutig horizontale, ausreichend lange Wischgesten zählen -
    // sonst würde normales vertikales Scrollen das Menü mit auslösen.
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;

    if (deltaX < 0) {
      overlay.classList.add("open");
    } else {
      overlay.classList.remove("open");
    }
  }, { passive: true });
}

// --- To-Do-Liste (bleibt gespeichert, bis du Einträge selbst löschst) ---
function ladeTodos() {
  return JSON.parse(localStorage.getItem("dayguide_todos") || "[]");
}
function speichereTodos(todos) {
  localStorage.setItem("dayguide_todos", JSON.stringify(todos));
}

function renderTodo() {
  renderHausaufgabenWidget(); // Desktop-Widget immer mit aktualisieren, unabhängig vom Menü-Zustand
  const list = document.getElementById("todo-list");
  if (!list) return; // vor dem ersten Menü-Öffnen noch nicht im DOM relevant
  const todos = ladeTodos();
  const notizText = (localStorage.getItem("dayguide_notiz") || "").trim();

  // Index bezieht sich immer auf die Position im VOLLSTÄNDIGEN todos-Array
  // (über Objekt-Referenz gefunden), auch wenn hier nur eine gefilterte
  // Teilmenge (z. B. nur "hausaufgaben") gerade gerendert wird.
  function zeileHtml(t) {
    const i = todos.indexOf(t);
    return `
      <label class="checklist-row todo-row${t.done ? " done" : ""}">
        <input type="checkbox" data-i="${i}" ${t.done ? "checked" : ""}>
        <span>${t.text}</span>
        <span class="todo-delete" data-i="${i}">✕</span>
      </label>`;
  }

  let html = "";
  if (notizText) {
    html += `
      <div class="checklist-row todo-notiz-row" id="todo-notiz-pin">
        <span class="todo-notiz-label">Notiz</span>
        <span>${notizText}</span>
      </div>`;
  }

  const allgemein = todos.filter(t => !t.folder);
  const hausaufgaben = todos.filter(t => t.folder === "hausaufgaben");
  const lernplan = todos.filter(t => t.folder === "lernplan");

  if (todos.length === 0) {
    html += `<div class="empty">Keine Aufgaben.</div>`;
  } else {
    html += allgemein.map(zeileHtml).join("");
    if (hausaufgaben.length > 0 || lernplan.length > 0) {
      html += `<div class="todo-ordner-label">Schule</div>`;
      if (hausaufgaben.length > 0) {
        html += `<div class="todo-unterordner-label">Hausaufgaben</div>` + hausaufgaben.map(zeileHtml).join("");
      }
      if (lernplan.length > 0) {
        html += `<div class="todo-unterordner-label">Lernplan</div>` + lernplan.map(zeileHtml).join("");
      }
    }
  }

  list.innerHTML = html;

  const pin = document.getElementById("todo-notiz-pin");
  if (pin) {
    pin.addEventListener("click", () => {
      document.getElementById("menu-overlay").classList.remove("open");
      document.getElementById("notiz-popup").style.display = "block";
    });
  }

  list.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", () => {
      const todos = ladeTodos();
      todos[cb.dataset.i].done = cb.checked;
      speichereTodos(todos);
      renderTodo();
    });
  });
  list.querySelectorAll(".todo-delete").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const todos = ladeTodos();
      todos.splice(Number(el.dataset.i), 1);
      speichereTodos(todos);
      renderTodo();
    });
  });
}

function setupTodoInput() {
  const input = document.getElementById("todo-input");
  const btn = document.getElementById("todo-add-btn");

  function hinzufuegen() {
    const text = input.value.trim();
    if (!text) return;
    const todos = ladeTodos();
    todos.push({ text, done: false });
    speichereTodos(todos);
    input.value = "";
    renderTodo();
  }

  btn.addEventListener("click", hinzufuegen);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") hinzufuegen();
  });
}

// Angezeigter Monat (unabhängig vom heutigen Datum, per Pfeile änderbar).
let kalenderJahr = null;
let kalenderMonat = null;

function ladeKalenderNotizen() {
  return JSON.parse(localStorage.getItem("dayguide_kalender_notizen") || "{}");
}
function speichereKalenderNotizen(notizen) {
  localStorage.setItem("dayguide_kalender_notizen", JSON.stringify(notizen));
}
function kalenderDatumKey(jahr, monat, tag) {
  return `${jahr}-${String(monat + 1).padStart(2, "0")}-${String(tag).padStart(2, "0")}`;
}

// Baut nur das Grid-HTML für einen Monat - genutzt sowohl von der
// interaktiven Kalender-Ansicht im Menü als auch vom read-only Desktop-Widget.
function kalenderGridHtml(jahr, monat) {
  const heute = new Date();

  const pruefungsTage = new Set(
    PRUEFUNGEN.filter(p => {
      const d = new Date(p.date);
      return d.getFullYear() === jahr && d.getMonth() === monat;
    }).map(p => new Date(p.date).getDate())
  );

  const kalenderNotizen = ladeKalenderNotizen();
  const notizTage = new Set(
    Object.keys(kalenderNotizen)
      .filter(key => (kalenderNotizen[key] || "").trim())
      .filter(key => {
        const [ky, km] = key.split("-").map(Number);
        return ky === jahr && km === monat + 1;
      })
      .map(key => Number(key.split("-")[2]))
  );

  const ersterTagWochentag = (new Date(jahr, monat, 1).getDay() + 6) % 7; // Mo=0
  const anzahlTage = new Date(jahr, monat + 1, 0).getDate();
  const heuteTag = (jahr === heute.getFullYear() && monat === heute.getMonth()) ? heute.getDate() : -1;

  let html = `<div class="kalender-grid">`;
  ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].forEach(w => {
    html += `<div class="kalender-wochentag">${w}</div>`;
  });
  for (let i = 0; i < ersterTagWochentag; i++) {
    html += `<div class="kalender-tag leer"></div>`;
  }
  for (let tag = 1; tag <= anzahlTage; tag++) {
    const klassen = ["kalender-tag"];
    if (tag === heuteTag) klassen.push("heute");
    if (pruefungsTage.has(tag)) klassen.push("pruefung");
    if (notizTage.has(tag)) klassen.push("notiz-vorhanden");
    html += `<div class="${klassen.join(" ")}" data-tag="${tag}">${tag}</div>`;
  }
  html += `</div>`;
  return html;
}

function renderKalender() {
  const heute = new Date();
  if (kalenderJahr === null) {
    kalenderJahr = heute.getFullYear();
    kalenderMonat = heute.getMonth();
  }
  const jahr = kalenderJahr;
  const monat = kalenderMonat;
  const monatsName = new Date(jahr, monat, 1).toLocaleDateString("de-CH", { month: "long", year: "numeric" });
  document.getElementById("kalender-monat-label").textContent = monatsName;

  document.getElementById("kalender-content").innerHTML = kalenderGridHtml(jahr, monat);

  document.querySelectorAll("#kalender-content .kalender-tag:not(.leer)").forEach(el => {
    el.addEventListener("click", () => oeffneKalenderPopup(jahr, monat, Number(el.dataset.tag)));
  });
}

// --- Desktop-Widget (siehe Media Query in index.html): kompakter,
// nicht-interaktiver Ausblick auf den AKTUELLEN Monat (unabhängig davon,
// welchen Monat man sich zuletzt im Menü angeschaut hat). Ersetzt auf dem
// Desktop die morgendlichen Sachen (Bus/Morgenroutine), die dort laut Tim
// nicht gebraucht werden. ---
function renderKalenderWidget() {
  const el = document.getElementById("kalender-widget-content");
  if (!el) return;
  const heute = new Date();
  const monatsName = heute.toLocaleDateString("de-CH", { month: "long", year: "numeric" });
  document.getElementById("kalender-widget-label").textContent = `Kalender · ${monatsName}`;
  el.innerHTML = kalenderGridHtml(heute.getFullYear(), heute.getMonth());
}

function kalenderMonatWechseln(delta) {
  kalenderMonat += delta;
  if (kalenderMonat < 0) { kalenderMonat = 11; kalenderJahr--; }
  if (kalenderMonat > 11) { kalenderMonat = 0; kalenderJahr++; }
  document.getElementById("kalender-popup").style.display = "none";
  renderKalender();
}

function oeffneKalenderPopup(jahr, monat, tag) {
  const key = kalenderDatumKey(jahr, monat, tag);
  const popup = document.getElementById("kalender-popup");
  const label = document.getElementById("kalender-popup-datum");
  const text = document.getElementById("kalender-popup-text");
  const notizen = ladeKalenderNotizen();

  label.textContent = new Date(jahr, monat, tag).toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long" });
  text.value = notizen[key] || "";
  popup.dataset.key = key;
  popup.style.display = "block";
  text.focus();
}

function setupKalenderPopup() {
  const popup = document.getElementById("kalender-popup");
  const text = document.getElementById("kalender-popup-text");
  const loeschen = document.getElementById("kalender-popup-loeschen");

  text.addEventListener("blur", () => {
    const key = popup.dataset.key;
    if (!key) return;
    const notizen = ladeKalenderNotizen();
    const wert = text.value.trim();
    if (wert) notizen[key] = wert; else delete notizen[key];
    speichereKalenderNotizen(notizen);
    renderKalender();
    renderKalenderWidget();
  });

  loeschen.addEventListener("click", (e) => {
    e.stopPropagation();
    const key = popup.dataset.key;
    const notizen = ladeKalenderNotizen();
    delete notizen[key];
    speichereKalenderNotizen(notizen);
    text.value = "";
    popup.style.display = "none";
    renderKalender();
    renderKalenderWidget();
  });

  document.addEventListener("click", (e) => {
    if (popup.style.display !== "none" && !popup.contains(e.target) && !e.target.classList.contains("kalender-tag")) {
      popup.style.display = "none";
    }
  });

  document.getElementById("kalender-prev").addEventListener("click", () => kalenderMonatWechseln(-1));
  document.getElementById("kalender-next").addEventListener("click", () => kalenderMonatWechseln(1));
}

function renderWochenplan() {
  const el = document.getElementById("wochenplan-content");
  const tage = [1, 2, 3, 4, 5, 6, 0];
  const tagesNamen = { 1: "Montag", 2: "Dienstag", 3: "Mittwoch", 4: "Donnerstag", 5: "Freitag", 6: "Samstag", 0: "Sonntag" };

  el.innerHTML = tage.map(tag => {
    const lektionen = STUNDENPLAN
      .filter(l => l.weekday === tag)
      .sort((a, b) => a.time.localeCompare(b.time));

    let inhalt = lektionen.length > 0
      ? lektionen.map(l => `
          <div class="lesson-row">
            <span class="lesson-time">${l.time}</span>
            <span>${l.subject}${l.room ? " · " + l.room : ""}</span>
          </div>`).join("")
      : `<div class="empty">Keine Lektionen eingetragen.</div>`;

    if (MEAL_PREP[tag]) {
      inhalt += `
        <div class="lesson-row meal-prep-row">
          <span class="lesson-time">–</span>
          <span>${MEAL_PREP[tag]}</span>
        </div>`;
    }

    return `<div class="wochentag-label">${tagesNamen[tag]}</div>${inhalt}`;
  }).join("");
}

function renderMorgenStundenplan() {
  const el = document.getElementById("morgen-stundenplan-content");
  const morgenWeekday = (new Date().getDay() + 1) % 7;
  const lektionen = STUNDENPLAN
    .filter(l => l.weekday === morgenWeekday)
    .sort((a, b) => a.time.localeCompare(b.time));

  if (lektionen.length === 0) {
    el.className = "empty";
    el.textContent = "Keine Schule morgen.";
    return;
  }

  el.className = "";
  el.innerHTML = lektionen.map(l => `
    <div class="lesson-row">
      <span class="lesson-time">${l.time}</span>
      <span>${l.subject}${l.room ? " · " + l.room : ""}</span>
    </div>`).join("");
}
