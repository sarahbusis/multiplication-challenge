const TOTAL_PROBLEMS = 50;
const DEFAULT_TIME_LIMIT_SECONDS = 180;

// Google Apps Script Web App URL for the Spark Multiplication Challenge backend.
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzBTcrmG25f-S_dbhY3FeUkBu4Ip49Ok9N-xj-St1J_1BMZSSOVv6lzikuSqe47m1vg/exec";

let currentLunchNumber = "";
let currentProblems = [];
let currentTimeLimitSeconds = DEFAULT_TIME_LIMIT_SECONDS;
let startTime = null;
let timerInterval = null;
let submitted = false;
let language = localStorage.getItem("multLang") || "en";

const translations = {
  en: {
    title: "Spark Academy Multiplication Challenge",
    subtitle: "50 facts. Do your best.",
    enterLunch: "Enter your Star Card ID",
    privacy: "Your name will not show on this website.",
    continueBtn: "Continue",
    currentLunch: "Current Star Card ID:",
    startChallenge: "Start Challenge",
    viewDashboard: "View My Dashboard",
    changeLunch: "Change Star Card ID",
    ready: "Ready?",
    readyText: "You will answer 50 multiplication facts. Your teacher controls the time limit.",
    start: "Start",
    back: "Back",
    challenge: "Challenge",
    typeFast: "Type your answers. Press Enter to move forward.",
    timeLeft: "Time left",
    submitNow: "Submit Now",
    results: "Results",
    score: "Score",
    percent: "Percent",
    timeUsed: "Time used",
    feedback: "Problem Feedback",
    tryAgain: "Try Again",
    home: "Home",
    myDashboard: "My Dashboard",
    lunchNumber: "Star Card ID:",
    noData: "No attempts yet. Try the challenge first!",
    bestScore: "Best score",
    bestPerfectTime: "Best 50/50 time",
    attempts: "Attempts",
    scoreOverTime: "Scores Over Time",
    mostMissed: "Most Missed Facts",
    correctAnswer: "Correct:",
    yourAnswer: "You:",
    blank: "blank",
    noPerfectYet: "No 50/50 yet",
    noMissedFacts: "No missed facts yet!",
    alertLunch: "Please enter your Star Card ID.",
    languageButton: "Español",
    settingsLoaded: "Time limit:",
    savingScore: "Saving score...",
    scoreSaved: "Score saved!",
    scoreSaveError: "Score could not be saved. Your local result is still shown.",
    loadingDashboard: "Loading your progress...",
    dashboardOffline: "Showing results saved on this device only. Could not reach the server."
  },
  es: {
    title: "Reto de multiplicación de Spark Academy",
    subtitle: "50 operaciones. Haz tu mejor esfuerzo.",
    enterLunch: "Escribe tu Star Card ID",
    privacy: "Tu nombre no aparecerá en este sitio web.",
    continueBtn: "Continuar",
    currentLunch: "Star Card ID actual:",
    startChallenge: "Empezar el reto",
    viewDashboard: "Ver mi tablero",
    changeLunch: "Cambiar Star Card ID",
    ready: "¿Listo?",
    readyText: "Contestarás 50 multiplicaciones. Tu maestro controla el límite de tiempo.",
    start: "Empezar",
    back: "Atrás",
    challenge: "Reto",
    typeFast: "Escribe tus respuestas. Presiona Enter para avanzar.",
    timeLeft: "Tiempo restante",
    submitNow: "Entregar ahora",
    results: "Resultados",
    score: "Puntaje",
    percent: "Porcentaje",
    timeUsed: "Tiempo usado",
    feedback: "Retroalimentación",
    tryAgain: "Intentar otra vez",
    home: "Inicio",
    myDashboard: "Mi tablero",
    lunchNumber: "Star Card ID:",
    noData: "Todavía no hay intentos. ¡Primero intenta el reto!",
    bestScore: "Mejor puntaje",
    bestPerfectTime: "Mejor tiempo con 50/50",
    attempts: "Intentos",
    scoreOverTime: "Puntajes con el tiempo",
    mostMissed: "Operaciones más falladas",
    correctAnswer: "Correcta:",
    yourAnswer: "Tú:",
    blank: "en blanco",
    noPerfectYet: "Todavía no hay 50/50",
    noMissedFacts: "¡Todavía no hay errores!",
    alertLunch: "Por favor escribe tu Star Card ID.",
    languageButton: "English",
    settingsLoaded: "Límite de tiempo:",
    savingScore: "Guardando puntaje...",
    scoreSaved: "¡Puntaje guardado!",
    scoreSaveError: "No se pudo guardar el puntaje. Tu resultado local todavía aparece.",
    loadingDashboard: "Cargando tu progreso...",
    dashboardOffline: "Mostrando solo los resultados guardados en este dispositivo. No se pudo conectar con el servidor."
  }
};

const screens = {
  home: document.getElementById("homeScreen"),
  ready: document.getElementById("readyScreen"),
  quiz: document.getElementById("quizScreen"),
  results: document.getElementById("resultsScreen"),
  dashboard: document.getElementById("dashboardScreen")
};

const lunchInput = document.getElementById("lunchInput");
const saveLunchBtn = document.getElementById("saveLunchBtn");
const homeChoices = document.getElementById("homeChoices");
const currentLunchDisplay = document.getElementById("currentLunchDisplay");
const goReadyBtn = document.getElementById("goReadyBtn");
const goDashboardBtn = document.getElementById("goDashboardBtn");
const changeLunchBtn = document.getElementById("changeLunchBtn");
const startBtn = document.getElementById("startBtn");
const backHomeFromReadyBtn = document.getElementById("backHomeFromReadyBtn");
const problemGrid = document.getElementById("problemGrid");
const timerDisplay = document.getElementById("timerDisplay");
const submitBtn = document.getElementById("submitBtn");
const feedbackGrid = document.getElementById("feedbackGrid");
const scoreDisplay = document.getElementById("scoreDisplay");
const percentDisplay = document.getElementById("percentDisplay");
const timeUsedDisplay = document.getElementById("timeUsedDisplay");
const retryBtn = document.getElementById("retryBtn");
const resultsDashboardBtn = document.getElementById("resultsDashboardBtn");
const resultsHomeBtn = document.getElementById("resultsHomeBtn");
const dashboardHomeBtn = document.getElementById("dashboardHomeBtn");
const dashboardLunchDisplay = document.getElementById("dashboardLunchDisplay");
const bestScoreDisplay = document.getElementById("bestScoreDisplay");
const bestPerfectTimeDisplay = document.getElementById("bestPerfectTimeDisplay");
const attemptCountDisplay = document.getElementById("attemptCountDisplay");
const missedFactsList = document.getElementById("missedFactsList");
const noDataMessage = document.getElementById("noDataMessage");
const dashboardContent = document.getElementById("dashboardContent");
const dashboardStatus = document.getElementById("dashboardStatus");
const scoreChart = document.getElementById("scoreChart");
const languageBtn = document.getElementById("languageBtn");
const timeLimitNote = document.getElementById("timeLimitNote");

const badgeOverlay = document.getElementById("badgeOverlay");
const closeBadgeBtn = document.getElementById("closeBadgeBtn");
const badgeIcon = document.getElementById("badgeIcon");
const badgeTitle = document.getElementById("badgeTitle");
const badgeText = document.getElementById("badgeText");

let saveStatusEl = null;

function t(key) {
  return translations[language][key] || translations.en[key] || key;
}

function applyLanguage() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });

  languageBtn.textContent = t("languageButton");
  localStorage.setItem("multLang", language);

  if (lunchInput) {
    lunchInput.placeholder = "Star Card ID";
  }

  updateTimeLimitNotes();
}

function showScreen(screenName) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[screenName].classList.add("active");
}

function initializeLunchNumber() {
  const savedLunch = localStorage.getItem("multLunchNumber");

  if (savedLunch) {
    currentLunchNumber = savedLunch;
    lunchInput.value = savedLunch;
    showHomeChoices();
  }
}

function showHomeChoices() {
  currentLunchDisplay.textContent = currentLunchNumber;
  homeChoices.classList.remove("hidden");
}

function hideHomeChoices() {
  homeChoices.classList.add("hidden");
}

function saveLunchNumber() {
  const value = lunchInput.value.trim();

  if (!value) {
    alert(t("alertLunch"));
    return;
  }

  currentLunchNumber = value;
  localStorage.setItem("multLunchNumber", currentLunchNumber);
  showHomeChoices();
}

function changeLunchNumber() {
  currentLunchNumber = "";
  localStorage.removeItem("multLunchNumber");
  lunchInput.value = "";
  hideHomeChoices();
  lunchInput.focus();
}

function generateAllFacts() {
  const facts = [];

  for (let a = 0; a <= 10; a++) {
    for (let b = 0; b <= 10; b++) {
      facts.push({
        factor1: a,
        factor2: b,
        correctAnswer: a * b
      });
    }
  }

  return facts;
}

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function generateProblemSet() {
  return shuffleArray(generateAllFacts()).slice(0, TOTAL_PROBLEMS);
}

function jsonpRequest(baseUrl, params = {}, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonpCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const url = new URL(baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    url.searchParams.set("callback", callbackName);

    const script = document.createElement("script");
    script.src = url.toString();

    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;

      // Apps Script's /exec endpoint can occasionally take 10-20+ seconds to
      // respond (this is normal Google-side cold-start latency, not a bug in
      // this app). Removing the <script> tag doesn't cancel a request that's
      // already in flight, so the slow response can still arrive and try to
      // call this callback later. Leaving a harmless no-op here (instead of
      // deleting it) prevents an "X is not defined" crash if that happens.
      window[callbackName] = function () {};

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      reject(new Error("JSONP request timed out."));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeout);

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    window[callbackName] = function (data) {
      if (settled) return;
      settled = true;

      cleanup();
      delete window[callbackName];
      resolve(data);
    };

    script.onerror = function () {
      if (settled) return;
      settled = true;

      cleanup();
      delete window[callbackName];
      reject(new Error("JSONP request failed."));
    };

    document.body.appendChild(script);
  });
}

// Apps Script's first request in a while is often much slower than the ones
// that follow (the container has to "wake up"). Rather than making every
// user wait through a very long timeout just in case, we try a shorter
// timeout first and only fall back to a longer, more patient one if needed.
async function jsonpRequestWithRetry(baseUrl, params = {}) {
  try {
    return await jsonpRequest(baseUrl, params, 12000);
  } catch (firstError) {
    console.warn("First JSONP attempt failed, retrying with a longer timeout:", firstError);
    return await jsonpRequest(baseUrl, params, 30000);
  }
}

async function loadSettings() {
  try {
    const data = await jsonpRequestWithRetry(WEB_APP_URL, {
      action: "getSettings",
      cacheBust: Date.now()
    });

    if (data && data.ok && Number(data.timeLimitSeconds)) {
      currentTimeLimitSeconds = Number(data.timeLimitSeconds);
      localStorage.setItem("multTimeLimitSeconds", String(currentTimeLimitSeconds));
      updateTimeLimitNotes();
      return;
    }

    useFallbackTimeLimit();
  } catch (error) {
    console.error("Settings failed to load:", error);
    useFallbackTimeLimit();
  }
}

function useFallbackTimeLimit() {
  const saved = Number(localStorage.getItem("multTimeLimitSeconds"));

  if (saved) {
    currentTimeLimitSeconds = saved;
  } else {
    currentTimeLimitSeconds = DEFAULT_TIME_LIMIT_SECONDS;
  }

  updateTimeLimitNotes();
}

function updateTimeLimitNotes() {
  const text = `${t("settingsLoaded")} ${formatSeconds(currentTimeLimitSeconds)}`;

  if (timeLimitNote) {
    timeLimitNote.textContent = text;
  }
}

async function startChallenge() {
  await loadSettings();

  currentProblems = generateProblemSet();
  startTime = Date.now();
  submitted = false;

  renderProblems();
  updateTimerDisplay(currentTimeLimitSeconds);

  showScreen("quiz");

  clearInterval(timerInterval);
  timerInterval = setInterval(handleTimerTick, 250);

  setTimeout(() => {
    const firstInput = document.querySelector(".answer-input");
    if (firstInput) firstInput.focus();
  }, 50);
}

function renderProblems() {
  problemGrid.innerHTML = "";

  currentProblems.forEach((problem, index) => {
    const card = document.createElement("div");
    card.className = "problem-card";

    const problemText = document.createElement("div");
    problemText.className = "problem-text";
    problemText.textContent = `${problem.factor1} × ${problem.factor2} =`;

    const input = document.createElement("input");
    input.className = "answer-input";
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.dataset.index = index;

    input.addEventListener("keydown", handleAnswerKeydown);
    input.addEventListener("input", handleAnswerInput);

    card.appendChild(problemText);
    card.appendChild(input);
    problemGrid.appendChild(card);
  });
}

function handleAnswerKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();

    const currentIndex = Number(event.target.dataset.index);
    const inputs = [...document.querySelectorAll(".answer-input")];
    const isLastInput = currentIndex === inputs.length - 1;

    if (isLastInput && allProblemsAnswered()) {
      submitAttempt();
      return;
    }

    focusNextInput(currentIndex);
  }
}

function handleAnswerInput() {
  // Do not auto-submit while typing.
}

function focusNextInput(currentIndex) {
  const inputs = [...document.querySelectorAll(".answer-input")];
  const nextInput = inputs[currentIndex + 1];

  if (nextInput) {
    nextInput.focus();
    nextInput.select();
  }
}

function allProblemsAnswered() {
  const inputs = [...document.querySelectorAll(".answer-input")];
  return inputs.length === TOTAL_PROBLEMS && inputs.every((input) => input.value.trim() !== "");
}

function handleTimerTick() {
  if (submitted) return;

  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  const remainingSeconds = Math.max(0, currentTimeLimitSeconds - elapsedSeconds);

  updateTimerDisplay(remainingSeconds);

  if (remainingSeconds <= 0) {
    submitAttempt();
  }
}

function updateTimerDisplay(seconds) {
  timerDisplay.textContent = formatSeconds(seconds);
}

function formatSeconds(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function submitAttempt() {
  if (submitted) return;

  submitted = true;
  clearInterval(timerInterval);

  const timeUsedSeconds = Math.min(
    currentTimeLimitSeconds,
    Math.round((Date.now() - startTime) / 1000)
  );

  const inputs = [...document.querySelectorAll(".answer-input")];

  const problemResults = currentProblems.map((problem, index) => {
    const rawAnswer = inputs[index]?.value.trim() || "";
    const numericAnswer = rawAnswer === "" ? null : Number(rawAnswer);
    const isCorrect = numericAnswer === problem.correctAnswer;

    return {
      problemNumber: index + 1,
      factor1: problem.factor1,
      factor2: problem.factor2,
      studentAnswer: rawAnswer,
      correctAnswer: problem.correctAnswer,
      isCorrect
    };
  });

  const score = problemResults.filter((result) => result.isCorrect).length;
  const percent = Math.round((score / TOTAL_PROBLEMS) * 100);
  // Stored/sent in compact form (e.g. "3x4"); expanded to "3 × 4" only for display.
  const missedFacts = problemResults
    .filter((result) => !result.isCorrect)
    .map((result) => encodeCompactFact(result.factor1, result.factor2));

  const attempt = {
    attemptId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    timestamp: new Date().toISOString(),
    lunchNumber: currentLunchNumber,
    score,
    percent,
    timeUsedSeconds,
    timeLimitSeconds: currentTimeLimitSeconds,
    completedBeforeTime: timeUsedSeconds < currentTimeLimitSeconds,
    problems: problemResults,
    missedFacts,
    synced: false
  };

  const previousAttempts = getAttemptsForCurrentStudent();

  saveAttemptLocally(attempt);
  renderResults(attempt);
  showScreen("results");

  sendAttemptToGoogleSheet(attempt);

  const updatedAttempts = getAttemptsForCurrentStudent();
  checkForBadges(attempt, previousAttempts, updatedAttempts);
}

async function sendAttemptToGoogleSheet(attempt) {
  setSaveStatus(t("savingScore"));

  try {
    const data = await jsonpRequestWithRetry(WEB_APP_URL, {
      action: "submitScore",
      starCardNumber: attempt.lunchNumber,
      score: String(attempt.score),
      timeUsedSeconds: String(attempt.timeUsedSeconds),
      timeLimitSeconds: String(attempt.timeLimitSeconds),
      completedBeforeTime: String(attempt.completedBeforeTime),
      missedFacts: (attempt.missedFacts || []).join(","),
      cacheBust: Date.now()
    });

    if (data && data.ok) {
      setSaveStatus(t("scoreSaved"));
      markAttemptSynced(attempt.attemptId);
    } else {
      console.error("Score save error:", data);
      setSaveStatus(t("scoreSaveError"));
    }
  } catch (error) {
    console.error("Score failed to save:", error);
    setSaveStatus(t("scoreSaveError"));
  }
}

// Marks a locally-stored attempt as successfully synced to the sheet, so the
// dashboard knows it doesn't need to fall back to the local copy for it.
function markAttemptSynced(attemptId) {
  const attempts = getLocalAttempts();
  const updated = attempts.map((attempt) =>
    attempt.attemptId === attemptId ? { ...attempt, synced: true } : attempt
  );
  localStorage.setItem("multAttempts", JSON.stringify(updated));
}

function setSaveStatus(message) {
  if (!saveStatusEl) {
    saveStatusEl = document.createElement("p");
    saveStatusEl.className = "helper";
    saveStatusEl.style.textAlign = "center";
    saveStatusEl.style.fontWeight = "800";

    const resultsCard = document.querySelector("#resultsScreen .card");
    const summaryGrid = document.querySelector("#resultsScreen .summary-grid");

    if (resultsCard && summaryGrid) {
      resultsCard.insertBefore(saveStatusEl, summaryGrid.nextSibling);
    }
  }

  saveStatusEl.textContent = message;
}

function setDashboardStatus(message) {
  if (dashboardStatus) {
    dashboardStatus.textContent = message || "";
  }
}

function saveAttemptLocally(attempt) {
  const attempts = getLocalAttempts();
  attempts.push(attempt);
  localStorage.setItem("multAttempts", JSON.stringify(attempts));
}

function getLocalAttempts() {
  try {
    return JSON.parse(localStorage.getItem("multAttempts")) || [];
  } catch {
    return [];
  }
}

function getAttemptsForCurrentStudent() {
  return getLocalAttempts().filter(
    (attempt) => String(attempt.lunchNumber) === String(currentLunchNumber)
  );
}

function renderResults(attempt) {
  scoreDisplay.textContent = `${attempt.score}/${TOTAL_PROBLEMS}`;
  percentDisplay.textContent = `${attempt.percent}%`;
  timeUsedDisplay.textContent = formatSeconds(attempt.timeUsedSeconds);

  feedbackGrid.innerHTML = "";

  attempt.problems.forEach((problem) => {
    const card = document.createElement("div");
    card.className = `feedback-card ${problem.isCorrect ? "correct" : "incorrect"}`;

    const symbol = problem.isCorrect
      ? `<span class="check">✓</span>`
      : `<span class="x">✕</span>`;

    const shownAnswer =
      problem.studentAnswer === "" ? t("blank") : problem.studentAnswer;

    card.innerHTML = `
      <div class="feedback-main">
        ${symbol} ${problem.factor1} × ${problem.factor2}
      </div>
      <div class="feedback-detail">
        ${t("yourAnswer")} ${shownAnswer}
      </div>
      ${
        problem.isCorrect
          ? ""
          : `<div class="feedback-detail">${t("correctAnswer")} ${problem.correctAnswer}</div>`
      }
    `;

    feedbackGrid.appendChild(card);
  });
}

// Fetches this student's full attempt history from the Google Sheet, so the
// dashboard shows the same data no matter which device they're on.
async function loadRemoteHistory(starCardNumber) {
  console.log("[dashboard] requesting getHistory for:", starCardNumber);

  const data = await jsonpRequestWithRetry(WEB_APP_URL, {
    action: "getHistory",
    starCardNumber,
    cacheBust: Date.now()
  });

  console.log("[dashboard] getHistory raw response:", data);

  if (!data || !data.ok || !Array.isArray(data.attempts)) {
    throw new Error("Could not load history from the sheet.");
  }

  return data.attempts.map((attempt) => ({
    timestamp: attempt.timestamp,
    score: Number(attempt.score) || 0,
    timeUsedSeconds: Number(attempt.timeUsedSeconds) || 0,
    timeLimitSeconds: Number(attempt.timeLimitSeconds) || 0,
    completedBeforeTime: Boolean(attempt.completedBeforeTime),
    missedFacts: parseMissedFactsField(attempt.missedFacts)
  }));
}

async function renderDashboard() {
  dashboardLunchDisplay.textContent = currentLunchNumber;

  console.log("[dashboard] renderDashboard() called for Star Card ID:", currentLunchNumber);

  const localAttempts = getAttemptsForCurrentStudent();
  let attempts = localAttempts;
  let usedRemote = false;

  setDashboardStatus(t("loadingDashboard"));

  try {
    const remoteAttempts = await loadRemoteHistory(currentLunchNumber);
    console.log("[dashboard] remote attempts received:", remoteAttempts.length, remoteAttempts);

    // Any local attempt that hasn't confirmed as synced yet (e.g. saved
    // offline, or the save silently failed) still gets shown, alongside
    // everything the sheet knows about from any device.
    const unsyncedLocal = localAttempts.filter((attempt) => !attempt.synced);
    attempts = [...remoteAttempts, ...unsyncedLocal].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    usedRemote = true;
  } catch (error) {
    console.error("[dashboard] Falling back to local-only dashboard data:", error);
    attempts = localAttempts;
  }

  console.log("[dashboard] final attempts used for rendering:", attempts.length, "usedRemote:", usedRemote);

  setDashboardStatus(usedRemote ? "" : t("dashboardOffline"));

  if (attempts.length === 0) {
    noDataMessage.classList.remove("hidden");
    dashboardContent.classList.add("hidden");
    return;
  }

  noDataMessage.classList.add("hidden");
  dashboardContent.classList.remove("hidden");

  const bestScore = Math.max(...attempts.map((attempt) => attempt.score));
  const perfectAttempts = attempts.filter((attempt) => attempt.score === TOTAL_PROBLEMS);

  const bestPerfectTime =
    perfectAttempts.length > 0
      ? Math.min(...perfectAttempts.map((attempt) => attempt.timeUsedSeconds))
      : null;

  bestScoreDisplay.textContent = `${bestScore}/${TOTAL_PROBLEMS}`;
  bestPerfectTimeDisplay.textContent =
    bestPerfectTime === null ? t("noPerfectYet") : formatSeconds(bestPerfectTime);
  attemptCountDisplay.textContent = attempts.length;

  renderScoreChart(attempts);
  renderMostMissedFacts(attempts);
}

function renderScoreChart(attempts) {
  const canvas = scoreChart;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 50;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#cbd5e1";

  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  ctx.fillStyle = "#334155";
  ctx.font = "16px Arial";
  ctx.fillText("50", 12, padding + 5);
  ctx.fillText("25", 12, padding + chartHeight / 2 + 5);
  ctx.fillText("0", 22, canvas.height - padding + 5);

  if (attempts.length === 1) {
    const x = padding + chartWidth / 2;
    const y = canvas.height - padding - (attempts[0].score / TOTAL_PROBLEMS) * chartHeight;

    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#2563eb";
    ctx.fill();

    ctx.fillStyle = "#334155";
    ctx.fillText(String(attempts[0].score), x + 10, y - 10);
    return;
  }

  const points = attempts.map((attempt, index) => {
    const x = padding + (index / (attempts.length - 1)) * chartWidth;
    const y = canvas.height - padding - (attempt.score / TOTAL_PROBLEMS) * chartHeight;
    return { x, y, score: attempt.score };
  });

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 4;
  ctx.stroke();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#2563eb";
    ctx.fill();

    ctx.fillStyle = "#334155";
    ctx.font = "14px Arial";
    ctx.fillText(String(point.score), point.x + 8, point.y - 8);
  });
}

function normalizeFact(factor1, factor2) {
  const low = Math.min(factor1, factor2);
  const high = Math.max(factor1, factor2);
  return `${low} × ${high}`;
}

// Compact, URL/CSV-safe encoding of a missed fact, e.g. "3x4". Used when
// sending facts to Apps Script and when reading them back from the sheet.
function encodeCompactFact(factor1, factor2) {
  const low = Math.min(factor1, factor2);
  const high = Math.max(factor1, factor2);
  return `${low}x${high}`;
}

function expandCompactFact(compact) {
  const [low, high] = compact.split("x").map(Number);
  return `${low} × ${high}`;
}

// Parses the raw comma-separated "Missed Facts" field returned by the sheet
// back into the same compact-string array format used for locally-stored
// attempts (e.g. "3x4"), so both sources can be handled identically.
function parseMissedFactsField(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderMostMissedFacts(attempts) {
  const missedCounts = {};

  attempts.forEach((attempt) => {
    (attempt.missedFacts || []).forEach((compactFact) => {
      const fact = expandCompactFact(compactFact);
      missedCounts[fact] = (missedCounts[fact] || 0) + 1;
    });
  });

  const sortedMisses = Object.entries(missedCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  missedFactsList.innerHTML = "";

  if (sortedMisses.length === 0) {
    missedFactsList.innerHTML = `<div class="missed-pill">${t("noMissedFacts")}</div>`;
    return;
  }

  sortedMisses.forEach(([fact]) => {
    const pill = document.createElement("div");
    pill.className = "missed-pill";

    const factors = fact.split(" × ");
    const factor1 = Number(factors[0]);
    const factor2 = Number(factors[1]);
    const answer = factor1 * factor2;

    pill.textContent = `${fact} = ${answer}`;

    missedFactsList.appendChild(pill);
  });
}

function checkForBadges(currentAttempt, previousAttempts, updatedAttempts) {
  const badges = [];

  const previousBest =
    previousAttempts.length > 0
      ? Math.max(...previousAttempts.map((attempt) => attempt.score))
      : 0;

  const previousPerfectAttempts = previousAttempts.filter(
    (attempt) => attempt.score === TOTAL_PROBLEMS
  );

  const previousBestPerfectTime =
    previousPerfectAttempts.length > 0
      ? Math.min(...previousPerfectAttempts.map((attempt) => attempt.timeUsedSeconds))
      : null;

  if (currentAttempt.score > previousBest) {
    badges.push({
      icon: "🏆",
      title: tBadge("personalBestTitle"),
      text: tBadge("personalBestText", `${currentAttempt.score}/${TOTAL_PROBLEMS}`)
    });
  }

  if (currentAttempt.score === TOTAL_PROBLEMS) {
    badges.push({
      icon: "💯",
      title: tBadge("perfectTitle"),
      text: tBadge("perfectText", formatSeconds(currentAttempt.timeUsedSeconds))
    });
  }

  if (
    currentAttempt.score === TOTAL_PROBLEMS &&
    previousBestPerfectTime !== null &&
    currentAttempt.timeUsedSeconds < previousBestPerfectTime
  ) {
    badges.push({
      icon: "⚡",
      title: tBadge("fastPerfectTitle"),
      text: tBadge("fastPerfectText", formatSeconds(currentAttempt.timeUsedSeconds))
    });
  }

  if (currentAttempt.score >= 40 && previousBest < 40) {
    badges.push({
      icon: "🎯",
      title: tBadge("fortyClubTitle"),
      text: tBadge("fortyClubText")
    });
  }

  if (currentAttempt.score >= 45 && previousBest < 45) {
    badges.push({
      icon: "🚀",
      title: tBadge("fortyFiveClubTitle"),
      text: tBadge("fortyFiveClubText")
    });
  }

  if (updatedAttempts.length === 3) {
    badges.push({
      icon: "🔥",
      title: tBadge("threeAttemptsTitle"),
      text: tBadge("threeAttemptsText")
    });
  }

  if (updatedAttempts.length === 10) {
    badges.push({
      icon: "🌟",
      title: tBadge("tenAttemptsTitle"),
      text: tBadge("tenAttemptsText")
    });
  }

  showBadgesOneAtATime(badges);
}

function tBadge(key, value) {
  const badgeTranslations = {
    en: {
      personalBestTitle: "New Personal Best!",
      personalBestText: `You scored ${value}. That is your highest score so far!`,
      perfectTitle: "Perfect Score!",
      perfectText: `You got 50/50 in ${value}. Amazing!`,
      fastPerfectTitle: "Fastest Perfect Score!",
      fastPerfectText: `Your new best 50/50 time is ${value}.`,
      fortyClubTitle: "40+ Club!",
      fortyClubText: "You scored at least 40 out of 50!",
      fortyFiveClubTitle: "45+ Club!",
      fortyFiveClubText: "You scored at least 45 out of 50!",
      threeAttemptsTitle: "Practice Streak!",
      threeAttemptsText: "You completed 3 challenge attempts!",
      tenAttemptsTitle: "Multiplication Master in Training!",
      tenAttemptsText: "You completed 10 challenge attempts!"
    },
    es: {
      personalBestTitle: "¡Nuevo récord personal!",
      personalBestText: `Sacaste ${value}. ¡Es tu puntaje más alto hasta ahora!`,
      perfectTitle: "¡Puntaje perfecto!",
      perfectText: `Sacaste 50/50 en ${value}. ¡Increíble!`,
      fastPerfectTitle: "¡Puntaje perfecto más rápido!",
      fastPerfectText: `Tu nuevo mejor tiempo con 50/50 es ${value}.`,
      fortyClubTitle: "¡Club de 40+!",
      fortyClubText: "¡Sacaste al menos 40 de 50!",
      fortyFiveClubTitle: "¡Club de 45+!",
      fortyFiveClubText: "¡Sacaste al menos 45 de 50!",
      threeAttemptsTitle: "¡Racha de práctica!",
      threeAttemptsText: "¡Completaste 3 intentos del reto!",
      tenAttemptsTitle: "¡Maestro de multiplicación en entrenamiento!",
      tenAttemptsText: "¡Completaste 10 intentos del reto!"
    }
  };

  return badgeTranslations[language][key] || badgeTranslations.en[key] || key;
}

function showBadgesOneAtATime(badges) {
  if (!badges || badges.length === 0) return;

  let badgeIndex = 0;

  function showCurrentBadge() {
    const badge = badges[badgeIndex];

    badgeIcon.textContent = badge.icon;
    badgeTitle.textContent = badge.title;
    badgeText.textContent = badge.text;
    badgeOverlay.classList.remove("hidden");
  }

  function closeCurrentBadge() {
    badgeOverlay.classList.add("hidden");
    badgeIndex++;

    closeBadgeBtn.removeEventListener("click", closeCurrentBadge);
    badgeOverlay.removeEventListener("click", handleOverlayClick);

    if (badgeIndex < badges.length) {
      setTimeout(() => {
        closeBadgeBtn.addEventListener("click", closeCurrentBadge);
        badgeOverlay.addEventListener("click", handleOverlayClick);
        showCurrentBadge();
      }, 250);
    }
  }

  function handleOverlayClick(event) {
    if (event.target === badgeOverlay) {
      closeCurrentBadge();
    }
  }

  closeBadgeBtn.addEventListener("click", closeCurrentBadge);
  badgeOverlay.addEventListener("click", handleOverlayClick);

  showCurrentBadge();
}

saveLunchBtn.addEventListener("click", saveLunchNumber);

lunchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    saveLunchNumber();
  }
});

goReadyBtn.addEventListener("click", async () => {
  await loadSettings();
  showScreen("ready");
});

goDashboardBtn.addEventListener("click", async () => {
  showScreen("dashboard");
  await renderDashboard();
});

changeLunchBtn.addEventListener("click", changeLunchNumber);

startBtn.addEventListener("click", startChallenge);

backHomeFromReadyBtn.addEventListener("click", () => showScreen("home"));

submitBtn.addEventListener("click", submitAttempt);

retryBtn.addEventListener("click", async () => {
  await loadSettings();
  showScreen("ready");
});

resultsDashboardBtn.addEventListener("click", async () => {
  showScreen("dashboard");
  await renderDashboard();
});

resultsHomeBtn.addEventListener("click", () => showScreen("home"));

dashboardHomeBtn.addEventListener("click", () => showScreen("home"));

languageBtn.addEventListener("click", () => {
  language = language === "en" ? "es" : "en";
  applyLanguage();
});

applyLanguage();
initializeLunchNumber();
loadSettings();
showScreen("home");
