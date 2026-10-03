/* ══════════════════════════════════════════════════════════════
   PlantTriage — rules-based diagnosis + 14-day revive plan
   Honest MVP: a rules engine reading tapped symptoms, NOT a vision
   model. No API keys, no network calls. All data stays on-device.
   ══════════════════════════════════════════════════════════════ */
"use strict";

/* ── Symptoms the user can tap ─────────────────────────────── */
const SYMPTOMS = [
  { id: "yellowing",  label: "Yellowing leaves",      icon: "🍂" },
  { id: "brown_tips", label: "Brown / crispy tips",   icon: "🤎" },
  { id: "drooping",   label: "Drooping stems",        icon: "🥀" },
  { id: "spots",      label: "Spots on leaves",       icon: "⚫" },
  { id: "wilting",    label: "Wilting (looks thirsty)", icon: "🫠" },
];

/* ── Issues: rules, honest confidence, how-to-tell-apart ──────
   key        = defining symptoms for this issue
   weights    = how strongly each symptom points at this issue
   coverage   = fraction of key symptoms present → confidence    */
const ISSUES = {
  root_rot: {
    name: "Overwatering / root rot",
    emoji: "💧",
    short: "Too much water is drowning the roots",
    summary: "Your plant is getting more water than its roots can handle. The roots are suffocating, which makes leaves yellow and droop — even though the soil is wet. This is the #1 killer of houseplants, and it is very fixable.",
    key: ["yellowing", "drooping", "wilting"],
    weights: { yellowing: 1, drooping: 1, wilting: 1, brown_tips: 0.25, spots: 0.2 },
    tell_apart: "The 2-second check: push a finger two knuckles into the soil. Soggy, heavy pot, musty smell = too much water. Bone-dry soil + light pot = underwatering. Wilting with WET soil is the classic root-rot tell — the roots can't drink.",
    first_aid: "Stop watering immediately. Let the soil dry out completely before anything else.",
  },
  underwatering: {
    name: "Underwatering",
    emoji: "🏜️",
    short: "The plant is thirsty",
    summary: "Your plant isn't getting enough water, so its leaves are wilting and the tips are drying out. The good news: most underwatered plants bounce back within a day or two of a proper soak.",
    key: ["wilting", "brown_tips"],
    weights: { wilting: 1, brown_tips: 1, drooping: 0.5, yellowing: 0.3, spots: 0.1 },
    tell_apart: "The 2-second check: is the soil bone-dry and the pot light to lift? Are the crispy parts DRY-crunchy (not mushy)? That's thirst. If the soil is wet but the plant still wilts, it's the opposite problem — overwatering.",
    first_aid: "Give it a thorough drink: bottom-water for 20 minutes so the soil soaks through, then let it drain.",
  },
  sunburn: {
    name: "Sunburn / light damage",
    emoji: "☀️",
    short: "Too much direct sun",
    summary: "Leaves that suddenly face harsh direct sun get scorched: crispy brown tips and bleached or brown patches. It's not a disease — the plant is sunburned, like us.",
    key: ["brown_tips", "spots"],
    weights: { brown_tips: 1, spots: 0.8, yellowing: 0.2, wilting: 0.3, drooping: 0.2 },
    tell_apart: "Scorched patches sit between the veins, on the side facing the window, and the damage appeared after a sun change. Brown tips that are accompanied by WILTING point at underwatering instead — sunburned plants usually still look perky overall.",
    first_aid: "Move it out of direct sun to bright indirect light today. Scorched leaves won't heal, but the plant will grow new healthy ones.",
  },
  pests: {
    name: "Pests (insects / mites)",
    emoji: "🐛",
    short: "Something is eating the plant",
    summary: "Spots, stippling and weak growth often mean tiny visitors: spider mites, scale, aphids or mealybugs. Pests are very common and very treatable — the fix starts with looking closely.",
    key: ["spots"],
    weights: { spots: 1, yellowing: 0.5, drooping: 0.2, wilting: 0.2, brown_tips: 0.15 },
    tell_apart: "The 2-second check: look at the UNDERSIDE of the leaves and the stems. Tiny moving specks, fine webbing, sticky honeydew, or cottony fluff = pests. If the spots are dry, sunken and only on the sun-facing side, suspect sunburn instead.",
    first_aid: "Isolate the plant today, wipe leaves with a damp cloth, and check every leaf underside — including the stems.",
  },
  nutrient: {
    name: "Nutrient deficiency",
    emoji: "🧪",
    short: "It's hungry — missing food",
    summary: "A plant that's otherwise perky but turning yellow — especially older, lower leaves — is usually hungry: it's run out of nutrients in the pot. Overwatering causes yellowing too, so the soil check decides it.",
    key: ["yellowing"],
    weights: { yellowing: 1, brown_tips: 0.4, spots: 0.15, drooping: 0.15, wilting: 0.15 },
    tell_apart: "The 2-second check: if the soil is DRY-ish and the plant isn't drooping, yellow leaves (old ones first, or yellow between green veins) = hunger. If the soil is wet and the plant droops too, that's overwatering, not hunger.",
    first_aid: "Feed it a balanced, half-strength houseplant fertilizer — and only when the soil is slightly damp.",
  },
};

/* ── 14-day revive plan: shared skeleton + per-issue days ──── */
const BASE_PLAN = [
  { day: 1,  title: "Stop and assess",        text: "Do today's first-aid step for your diagnosis (below), then photograph your plant from a consistent angle — you'll compare on Day 13." },
  { day: 2,  title: "Set the environment",     text: "Keep it in bright, INDIRECT light and away from radiators, AC vents and cold drafts. Stability beats drama for a stressed plant." },
  { day: 3,  title: "Look closely",           text: "Check the undersides of leaves, the stems and the soil surface. Note anything new — that's your recovery diary." },
  { day: 4,  title: "First treatment",        text: "Follow today's treatment step for your diagnosis. One change at a time — plants hate being fixed with everything at once." },
  { day: 5,  title: "Trim with care",         text: "Remove only fully dead or mushy leaves with clean scissors. Leave anything half-alive — it's still feeding the plant." },
  { day: 6,  title: "Let it rest",            text: "No watering, no feeding, no moving. A stressed plant recovers fastest when you mostly leave it alone." },
  { day: 7,  title: "Week-one check-in",      text: "You've done a full week. Take a photo and compare with Day 1 — recovery is slow, so look for small wins: firmer stems, less droop." },
  { day: 8,  title: "Feed or adjust",         text: "Follow today's step for your diagnosis. Adjust one knob (water, light, food), never all three." },
  { day: 9,  title: "Even light",             text: "Rotate the pot a quarter turn so every side gets light. Plants lean toward windows — rotation keeps them straight and strong." },
  { day: 10, title: "Watering check",         text: "Before you ever water: stick a finger two knuckles deep. Only water when the soil is dry there. This one habit saves more plants than any product." },
  { day: 11, title: "Look for new growth",    text: "New leaves, fresh green at the tips, or roots at the drainage hole are the signals you're winning. Say hi to them." },
  { day: 12, title: "Keep it stable",         text: "Same spot, same schedule, same temperature. Plants forgive a lot — except constant change." },
  { day: 13, title: "Compare photos",         text: "Side-by-side your Day 1 photo with today. Even if it's subtle, something moved. That's the proof the revive is working." },
  { day: 14, title: "Graduation day 🎓",      text: "Write your one-line plant rule (e.g. 'check the soil before I water'). That habit IS the rescue. You're now the person whose plants survive." },
];

const ISSUE_PLAN_DAYS = {
  root_rot: {
    1:  "STOP watering — today and for a while. Push a finger into the soil: it should feel like a wrung-out sponge at most. Let the pot dry out completely.",
    4:  "If the soil is still soggy by Day 4: unpot gently, shake off wet soil, and sniff the roots. Trim any dark, mushy, smelly roots with clean scissors, then repot in fresh, well-draining soil.",
    8:  "Water only when the soil is dry two knuckles deep — for a recovering root system that may mean waiting several days. When you do water, water deeply and let it drain.",
    10: "Lift the pot: heavy = still wet inside, skip watering. Light = dry, and only then water. Weight is your new watering app.",
  },
  underwatering: {
    1:  "Bottom-water today: set the pot in a bowl of water for 20–30 minutes so the soil soaks from below, then let it drain fully. Never let it sit in water overnight.",
    4:  "Water again if the top two knuckles of soil are dry. Add a gentle soak — then start a rhythm: same day each week, checked against the finger test.",
    8:  "If the plant perks up but tips stay crispy, the air may be very dry. Group it near other plants or set a saucer of water beside it (not under it).",
    10: "Finger test before every watering. Thirsty plants forgive a late drink — they rarely forgive a constant flood.",
  },
  sunburn: {
    1:  "Move it out of direct sun TODAY. Bright indirect light (a meter back from a window, or behind a sheer curtain) is the burn ward.",
    4:  "Trim the most scorched leaves — they won't heal and the plant is spending energy on them. Keep the half-damaged ones.",
    8:  "After a week of indirect light, start re-acclimating: 30–60 minutes of gentle morning sun, increasing a little each day. Ease it back in like sunscreen season.",
    10: "Watch the light at noon: if a leaf would be in harsh sun, so would your plant. Move it or shade it.",
  },
  pests: {
    1:  "Isolate the plant away from your other plants. Wipe every leaf top and bottom with a damp cloth to remove visible pests, and check stems and leaf joints.",
    4:  "Treat with insecticidal soap or a 1:4 dish-soap-and-water spray (test one leaf first). Spray the undersides — that's where they live.",
    8:  "Re-check daily. Pests hatch in waves, so one spray is rarely enough. Repeat treatment every 4–5 days until you see no new spots or webbing for two weeks.",
    10: "Quarantine ends only when you've gone a week with zero new signs. Meanwhile, wash your hands before touching other plants.",
  },
  nutrient: {
    1:  "Don't feed a stressed plant — first let it settle. If the soil is dry, give it a normal drink today and wait.",
    4:  "Feed with a balanced houseplant fertilizer at HALF strength, onto slightly damp soil. More is not better — overfeeding burns roots.",
    8:  "Second half-strength feed if new leaves still come out pale. Yellowing between green veins (not whole leaves) often means iron or magnesium — a balanced feed covers both.",
    10: "Skip a feed this week and just water. If leaves are recovering, your plant is telling you the dose was right.",
  },
};

/* ── Diagnosis engine ──────────────────────────────────────── */
function diagnose(symptomIds) {
  const set = new Set(symptomIds);

  const scored = Object.entries(ISSUES).map(([id, iss]) => {
    const keyHits = iss.key.filter(k => set.has(k)).length;
    const coverage = iss.key.length ? keyHits / iss.key.length : 0;
    const score = Object.entries(iss.weights)
      .filter(([s]) => set.has(s))
      .reduce((sum, [, w]) => sum + w, 0);
    return { id, ...iss, coverage, score };
  });

  scored.sort((a, b) => (b.score - a.score) || (b.coverage - a.coverage));
  const top = scored[0];
  const runner = scored[1];

  // Confidence from how many defining symptoms are present.
  let conf;
  if (top.coverage >= 1)      conf = 0.85;
  else if (top.coverage >= 0.66) conf = 0.72;
  else if (top.coverage >= 0.5)  conf = 0.6;
  else                           conf = 0.45;

  // Mixed signals: symptoms point at both wet and dry problems.
  const hasDry = set.has("wilting") || set.has("brown_tips");
  const hasWet = set.has("drooping") || set.has("yellowing");
  const mixed = hasDry && hasWet;

  const closeRace = runner && (top.score - runner.score) <= 0.25 * Math.max(top.score, 0.001);

  return {
    top, runner: closeRace ? runner : null, conf, mixed,
    label: conf >= 0.8 ? "LIKELY" : conf >= 0.65 ? "POSSIBLE" : "WORTH CHECKING",
  };
}

/* ── 14-day plan builder ───────────────────────────────────── */
function buildPlan(issueId) {
  const overrides = ISSUE_PLAN_DAYS[issueId] || {};
  return BASE_PLAN.map(step => {
    const text = overrides[step.day] || step.text;
    return {
      day: step.day,
      title: step.title,
      text,
      goal: step.day === 14,
    };
  });
}

/* ══════════════════════════════════════════════════════════════
   App state + routing
   ══════════════════════════════════════════════════════════════ */
const state = {
  screen: "home",
  photoDataUrl: null,
  afterPhotoDataUrl: null,
  saved: false,
  manualDiagnosis: false,
  demo: false,
  plantName: "your plant",
  symptoms: [],
  diagnosis: null,
  plan: null,
  planId: null,
};

const $ = id => document.getElementById(id);
const screens = ["home", "photo", "symptoms", "diagnosis", "plan", "saved"];
const STEP_OF = { home: 1, photo: 2, symptoms: 3, diagnosis: 4, plan: 5, saved: 6 };

function showScreen(name) {
  state.screen = name;
  screens.forEach(s => $(`screen-${s}`).classList.toggle("active", s === name));
  document.querySelectorAll(".dot").forEach(d => {
    const s = +d.dataset.step;
    d.classList.toggle("on", s === STEP_OF[name]);
    d.classList.toggle("done", s < STEP_OF[name]);
  });
  const heading = $(`screen-${name}`).querySelector("h1, h2");
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  window.scrollTo({ top: 0, behavior: "instant" });
  saveSession();
}

/* ── Symptom chips ─────────────────────────────────────────── */
function renderChips() {
  const wrap = $("symptom-chips");
  wrap.innerHTML = "";
  SYMPTOMS.forEach(s => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.symptom = s.id;
    btn.setAttribute("aria-pressed", String(state.symptoms.includes(s.id)));
    btn.className = "chip" + (state.symptoms.includes(s.id) ? " selected" : "");
    btn.innerHTML = `<span class="chip-icon">${s.icon}</span>
      <span class="chip-label">${s.label}</span>
      <span class="chip-check">✓</span>`;
    btn.addEventListener("click", () => {
      const i = state.symptoms.indexOf(s.id);
      if (i >= 0) state.symptoms.splice(i, 1); else state.symptoms.push(s.id);
      renderChips();
      wrap.querySelector(`[data-symptom="${s.id}"]`).focus();
      saveSession();
      $("btn-diagnose").disabled = state.symptoms.length === 0;
    });
    wrap.appendChild(btn);
  });
  $("btn-diagnose").disabled = state.symptoms.length === 0;
}

/* ── Diagnosis screen ──────────────────────────────────────── */
function renderDiagnosis() {
  const d = state.diagnosis;
  const c = d.conf;
  const confClass = c >= 0.8 ? "conf-high" : c >= 0.65 ? "conf-med" : "conf-low";
  const pct = Math.round(c * 100);

  let html = `
    <div class="diag-card">
      <div class="diag-head">
        <span class="diag-emoji">${d.top.emoji}</span>
        <div>
          <h2 class="diag-title">${d.top.name}</h2>
          <p class="diag-sub">${d.top.short}</p>
        </div>
      </div>
      <div class="conf-meter">
        <div class="conf-row">
          <span class="conf-label">Confidence</span>
          <span>${d.label} · ${pct}%</span>
        </div>
        <div class="conf-track"><div class="conf-fill ${confClass}" style="width:${pct}%"></div></div>
      </div>
      <div class="diag-body"><p>${d.top.summary}</p></div>
      <div class="tell-apart"><strong><span class="ta-emoji">🔍</span>How to tell for sure:</strong><br>${d.top.tell_apart}</div>`;

  if (d.runner) {
    html += `<div class="runner-up"><strong>⚠️ Could also be: ${d.runner.emoji} ${d.runner.name}.</strong><br>${d.runner.tell_apart}<button class="btn btn-ghost" id="btn-alternative">Use this alternative after checking</button></div>`;
  }
  if (d.mixed) {
    html += `<div class="mixed-signal"><strong>🫥 Mixed signals:</strong> your symptoms point at both a thirsty and a drowning plant — the 2-second soil check above settles it in ten seconds.</div>`;
  }
  html += `<p style="font-size:12px;color:var(--ink-soft);margin-top:12px">Rules engine estimate from the symptoms you tapped — not a vision model, not a vet. When in doubt, trust the soil check.</p>`;
  if (state.photoDataUrl) {
    html += `<img class="photo-mini" src="${state.photoDataUrl}" alt="Your plant">`;
  }
  html += `</div>`;

  $("diag-content").innerHTML = html;
  $("btn-alternative")?.addEventListener("click", () => {
    const previous = state.diagnosis.top;
    state.manualDiagnosis = true;
    state.diagnosis = { ...state.diagnosis, top: state.diagnosis.runner, runner: previous,
      conf: 0.45, label: "WORTH CHECKING" };
    state.plan = null; state.planId = null; state.saved = false;
    renderDiagnosis(); saveSession();
  });
}

/* ── Plan screen ───────────────────────────────────────────── */
const SESSION_KEY = "planttriage.active.v1";
function storageWarning() {
  $("storage-status").textContent = "Your progress is available in this tab, but could not be saved on this device. Keep this tab open.";
}
function saveSession() {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      version: 1, screen: state.screen, demo: state.demo, symptoms: state.symptoms,
      issue: state.diagnosis?.top.id || null, manualDiagnosis: state.manualDiagnosis, planId: state.planId,
      checked: state.plan?.map(d => !!d.done) || null, saved: state.saved,
      photo: state.photoDataUrl, afterPhoto: state.afterPhotoDataUrl,
    }));
    $("storage-status").textContent = "";
  } catch { storageWarning(); }
}
function savePlanState() {
  if (!state.planId || !state.plan) return;
  try {
    localStorage.setItem(`planttriage.plan.${state.planId}`, JSON.stringify({
      issue: state.diagnosis.top.id, checked: state.plan.map(d => !!d.done), saved: state.saved,
    }));
  } catch { storageWarning(); }
  saveSession();
}
function restoreSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.version !== 1 || !screens.includes(data.screen) || !Array.isArray(data.symptoms)
        || data.symptoms.some(id => !SYMPTOMS.some(s => s.id === id))
        || (data.issue && !Object.hasOwn(ISSUES, data.issue))) throw new Error("Invalid saved session");
    if (["diagnosis", "plan", "saved"].includes(data.screen) && (!data.issue || !data.symptoms.length)) throw new Error("Missing diagnosis");
    if (["plan", "saved"].includes(data.screen) && (!data.planId || !Array.isArray(data.checked)
      || data.checked.length !== 14 || data.checked.some(done => typeof done !== "boolean"))) throw new Error("Missing plan");
    state.demo = data.demo === true;
    state.plantName = state.demo ? "Money tree" : "your plant";
    state.symptoms = data.symptoms;
    const photo = value => typeof value === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value) ? value : null;
    state.photoDataUrl = photo(data.photo); state.afterPhotoDataUrl = photo(data.afterPhoto);
    state.saved = data.saved === true;
    state.manualDiagnosis = data.manualDiagnosis === true;
    if (data.issue) {
      state.diagnosis = diagnose(state.symptoms);
      if (state.diagnosis.top.id !== data.issue) {
        state.diagnosis = { ...state.diagnosis, runner: state.diagnosis.top,
          top: { id: data.issue, ...ISSUES[data.issue] }, conf: 0.45, label: "WORTH CHECKING" };
      }
    }
    if (state.manualDiagnosis && state.diagnosis) {
      state.diagnosis.conf = 0.45; state.diagnosis.label = "WORTH CHECKING";
    }
    if (data.issue && data.planId && Array.isArray(data.checked) && data.checked.length === 14) {
      state.planId = data.planId;
      state.plan = buildPlan(data.issue).map((d, i) => ({ ...d, done: data.checked[i] === true }));
    }
    renderPhoto(); renderChips();
    if (state.diagnosis) renderDiagnosis();
    if (state.plan) renderPlan();
    if (data.screen === "saved") renderSaved();
    showScreen(data.screen);
  } catch {
    $("storage-status").textContent = "Your saved session could not be restored. Start a new rescue; existing plan records have been kept.";
  }
}

function renderPlan() {
  const done = state.plan.filter(d => d.done).length;
  const pct = Math.round((done / state.plan.length) * 100);
  $("plan-header").innerHTML = `
    <div class="plan-head">
      <span class="ph-emoji">${state.diagnosis.top.emoji}</span>
      <h2>${state.plantName}'s 14-day revive plan</h2>
      <p class="lede">${state.diagnosis.top.name} · one small step a day.</p>
    </div>
    <div class="plan-progress">
      <div class="pp-num" role="status" aria-label="Plan progress">${done} / ${state.plan.length} days done</div>
      <div class="pp-bar"><div class="pp-fill" style="width:${pct}%"></div></div>
    </div>`;

  const wrap = $("plan-days");
  wrap.innerHTML = "";
  state.plan.forEach(d => {
    const el = document.createElement("div");
    el.className = "day" + (d.done ? " done" : "") + (d.goal ? " goal" : "");
    el.innerHTML = `
      <button class="day-check" aria-label="Mark day ${d.day} done" aria-pressed="${!!d.done}">✓</button>
      <div>
        <span class="day-daynum">Day ${d.day}</span>
        <p class="day-title">${d.title}</p>
        <p class="day-text">${d.text}</p>
      </div>`;
    el.querySelector(".day-check").addEventListener("click", () => {
      d.done = !d.done;
      savePlanState();
      renderPlan();
      wrap.querySelectorAll(".day-check")[d.day - 1].focus();
    });
    wrap.appendChild(el);
  });
}

/* ── Saved screen ──────────────────────────────────────────── */
function renderSaved() {
  const done = state.plan.filter(d => d.done).length;
  const after = state.afterPhotoDataUrl ? `<img class="ba-img" src="${state.afterPhotoDataUrl}" alt="After">` : `<div class="ba-img" aria-label="No recovery photo yet">💚🌿</div>`;
  const before = state.photoDataUrl
    ? `<img class="ba-img" src="${state.photoDataUrl}" alt="Before">`
    : `<div class="ba-img">🪴</div>`;
  $("saved-content").innerHTML = `
    <div class="saved-wrap">
      <span class="sw-emoji">🌱</span>
      <h1>You saved ${state.plantName}.</h1>
      <p class="sw-sub">${state.diagnosis.top.emoji} ${state.diagnosis.top.name} · ${done} / 14 days checked. Keep watching for recovery.</p>
      <div class="ba">
        <div class="ba-frame">${before}<div class="ba-cap">BEFORE</div></div>
        <div class="ba-arrow">→<small>Progress</small></div>
        <div class="ba-frame">${after}<div class="ba-cap">AFTER</div></div>
      </div>
      <div class="saved-mantra">You're the person whose plants survive.<small>Keep the habit: check the soil before you water.</small></div>
    </div>`;
  $("btn-remove-after").hidden = !state.afterPhotoDataUrl;
  launchConfetti();
}

function launchConfetti() {
  const box = document.querySelector(".confetti");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  box.innerHTML = "";
  const emojis = ["🌿", "💚", "✨", "🌱", "💛", "🍃"];
  for (let i = 0; i < 26; i++) {
    const s = document.createElement("span");
    s.textContent = emojis[i % emojis.length];
    s.style.left = Math.random() * 100 + "%";
    s.style.animationDuration = (2.4 + Math.random() * 2.2) + "s";
    s.style.animationDelay = (Math.random() * 0.8) + "s";
    box.appendChild(s);
  }
  setTimeout(() => { box.innerHTML = ""; }, 6000);
}

/* ── Photo handling ────────────────────────────────────────── */
let photoRequest = 0;
function renderPhoto() {
  $("photo-preview").hidden = !state.photoDataUrl;
  if (state.photoDataUrl) $("photo-preview").src = state.photoDataUrl;
  else $("photo-preview").removeAttribute("src");
  $("dropzone-inner").hidden = !!state.photoDataUrl;
  $("btn-remove-photo").hidden = !state.photoDataUrl;
}
function handlePhoto(file, after = false) {
  if (!file) return;
  const error = after ? $("after-photo-error") : $("photo-error");
  error.textContent = "";
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
    error.textContent = "Choose a JPG, PNG, WebP or GIF photo."; return;
  }
  if (file.size > 10 * 1024 * 1024) {
    error.textContent = "That photo is too large. Choose one under 10 MB."; return;
  }
  const request = ++photoRequest;
  const reader = new FileReader();
  reader.onerror = () => { error.textContent = "The photo could not be read. Try another file."; };
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => { if (request === photoRequest) error.textContent = "This image could not be opened. Try another photo."; };
    image.onload = () => {
      if (request !== photoRequest) return;
      try {
        const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        state[after ? "afterPhotoDataUrl" : "photoDataUrl"] = canvas.toDataURL("image/jpeg", 0.8);
        if (after) renderSaved(); else renderPhoto();
        saveSession();
      } catch { error.textContent = "This image could not be opened. Try another photo."; }
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/* ── Demo: MY money tree is DYING ──────────────────────────── */
function startDemo() {
  state.demo = true;
  state.manualDiagnosis = false;
  state.plantName = "Money tree";
  state.photoDataUrl = null;
  state.afterPhotoDataUrl = null;
  renderPhoto();               // honest: no fake photo, use the tree card
  state.symptoms = ["yellowing", "drooping", "wilting"]; // classic overwatered money tree
  state.diagnosis = diagnose(state.symptoms);
  state.planId = "demo-" + Date.now();
  state.plan = buildPlan(state.diagnosis.top.id).map(d => ({ ...d, done: false }));
  state.saved = false;
  renderDiagnosis();
  renderPlan();
  showScreen("diagnosis");
}

function newDiagnosis() {
  photoRequest++;
  state.photoDataUrl = null; state.afterPhotoDataUrl = null;
  state.symptoms = []; state.demo = false; state.plantName = "your plant";
  state.manualDiagnosis = false;
  state.diagnosis = null; state.plan = null; state.planId = null; state.saved = false;
  $("photo-input").value = ""; $("after-photo-input").value = "";
  $("photo-error").textContent = ""; $("after-photo-error").textContent = "";
  renderPhoto(); renderChips(); showScreen("home");
}

/* ══════════════════════════════════════════════════════════════
   Wire up events
   ══════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  renderChips();
  restoreSession();

  // Home
  $("btn-start").addEventListener("click", () => showScreen("photo"));
  $("btn-demo").addEventListener("click", startDemo);

  // Photo
  $("photo-input").addEventListener("change", e => handlePhoto(e.target.files[0]));
  $("dropzone").addEventListener("dragover", e => { e.preventDefault(); $("dropzone").classList.add("drag"); });
  $("dropzone").addEventListener("dragleave", () => $("dropzone").classList.remove("drag"));
  $("dropzone").addEventListener("drop", e => {
    e.preventDefault();
    $("dropzone").classList.remove("drag");
    handlePhoto(e.dataTransfer.files[0]);
  });
  $("btn-remove-photo").addEventListener("click", e => {
    photoRequest++;
    e.stopPropagation();
    state.photoDataUrl = null;
    $("photo-preview").hidden = true;
    $("dropzone-inner").hidden = false;
    $("btn-remove-photo").hidden = true;
    $("photo-input").value = "";
    renderPhoto(); saveSession();
  });
  $("btn-photo-next").addEventListener("click", () => showScreen("symptoms"));
  $("btn-photo-skip").addEventListener("click", () => showScreen("symptoms"));

  // Symptoms
  $("btn-symptoms-back").addEventListener("click", () => showScreen("photo"));
  $("btn-diagnose").addEventListener("click", () => {
    state.diagnosis = diagnose(state.symptoms);
    state.manualDiagnosis = false;
    state.plan = null; state.planId = null; state.saved = false;
    renderDiagnosis();
    showScreen("diagnosis");
  });

  // Diagnosis
  $("btn-diagnosis-back").addEventListener("click", () => { renderChips(); showScreen("symptoms"); });
  $("btn-plan").addEventListener("click", () => {
    state.planId = (state.demo ? "demo-" : "diag-") + Date.now();
    state.plan = buildPlan(state.diagnosis.top.id).map(d => ({ ...d, done: false }));
    state.saved = false;
    savePlanState();
    renderPlan();
    showScreen("plan");
  });

  // Plan
  $("btn-saved").addEventListener("click", () => {
    state.saved = true;

    savePlanState();
    renderSaved();
    showScreen("saved");
  });
  $("btn-plan-restart").addEventListener("click", newDiagnosis);

  // Saved
  $("after-photo-input").addEventListener("change", e => handlePhoto(e.target.files[0], true));
  $("btn-remove-after").addEventListener("click", () => {
    photoRequest++; state.afterPhotoDataUrl = null; $("after-photo-input").value = "";
    renderSaved(); saveSession();
  });
  $("btn-saved-back").addEventListener("click", () => { renderPlan(); showScreen("plan"); });
  $("btn-again").addEventListener("click", newDiagnosis);
});
