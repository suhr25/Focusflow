const texts = {
    en: {
        title: "FocusFlow",
        subtitle: "Your Study Glow Up Starts Here!",
        stopwatch: "Stopwatch",
        start: "Start",
        stop: "Stop",
        lap: "Lap",
        reset: "Reset",
        laps: "Laps",
        pomodoro: "Pomodoro",
        work: "Work",
        break: "Break",
        skip: "Skip",
        autoNext: "Auto Next",
        history: "Study History",
        clearHistory: "Clear History"
    },
    hi: {
        title: "फोकसफ्लो",
        subtitle: "आपकी स्टडी ग्लो-अप यहीं से शुरू होती है!",
        stopwatch: "स्टॉपवॉच",
        start: "शुरू",
        stop: "रोकें",
        lap: "लैप",
        reset: "रीसेट",
        laps: "लैप्स",
        pomodoro: "पोमोदोरों",
        work: "काम",
        break: "ब्रेक",
        skip: "स्किप",
        autoNext: "ऑटो नेक्स्ट",
        history: "स्टडी हिस्ट्री",
        clearHistory: "हिस्ट्री साफ करें"
    }
};

function applyLanguage(lang) {
    document.getElementById("title").textContent = texts[lang].title;
    document.getElementById("subtitle").textContent = texts[lang].subtitle;
    document.getElementById("stopwatchTitle").textContent = texts[lang].stopwatch;
    document.getElementById("swStartBtn").textContent = texts[lang].start;
    document.getElementById("swStopBtn").textContent = texts[lang].stop;
    document.getElementById("swLapBtn").textContent = texts[lang].lap;
    document.getElementById("swResetBtn").textContent = texts[lang].reset;
    document.getElementById("lapsTitle").textContent = texts[lang].laps;
    document.getElementById("pomoTitle").textContent = texts[lang].pomodoro;
    document.getElementById("pStartBtn").textContent = texts[lang].start;
    document.getElementById("pPauseBtn").textContent = texts[lang].stop;
    document.getElementById("pSkipBtn").textContent = texts[lang].skip;
    document.getElementById("pResetBtn").textContent = texts[lang].reset;
    document.getElementById("workLabel").textContent = texts[lang].work + ": ";
    document.getElementById("breakLabel").textContent = texts[lang].break + ": ";
    document.getElementById("autoNextLabel").textContent = texts[lang].autoNext;
    document.getElementById("historyTitle").textContent = texts[lang].history;
    document.getElementById("clearHistoryBtn").textContent = texts[lang].clearHistory;
}

document.getElementById("langSelect").onchange = function () {
    const lang = this.value;
    applyLanguage(lang);
    localStorage.setItem("appLanguage", lang);
};

const byId = (id) => document.getElementById(id);
const pad2 = (n) => String(n).padStart(2, '0');

function formatHMS(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function toDateKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + 1;
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function updateClock() {
    const now = new Date();
    const hh = pad2(now.getHours());
    const mm = pad2(now.getMinutes());
    const ss = pad2(now.getSeconds());
    byId("liveClock").textContent = `${hh}:${mm}:${ss}`;
}

function saveSession(type, duration) {
    if (duration <= 0) return;
    const history = JSON.parse(localStorage.getItem("studyHistory") || "[]");
    const now = new Date();
    history.push({
        type,
        duration,
        date: now.toLocaleString(),
        epoch: now.getTime(),
        dayKey: toDateKey(now)
    });
    localStorage.setItem("studyHistory", JSON.stringify(history));
    renderCalendarGrid();
    updateTodayWeekTotals();
}

function loadHistory() {
    return JSON.parse(localStorage.getItem("studyHistory") || "[]");
}

function saveHistoryArray(arr) {
    localStorage.setItem("studyHistory", JSON.stringify(arr));
}

let swElapsed = 0;
let swStartTime = null;

function swUpdate() {
    let elapsed = swElapsed;
    if (swStartTime !== null) {
        elapsed = swElapsed + Math.floor((Date.now() - swStartTime) / 1000);
    }
    byId("sw").textContent = formatHMS(elapsed);
}

function swStart() {
    if (swStartTime !== null) return;
    swStartTime = Date.now();
}

function swStop() {
    if (swStartTime !== null) {
        swElapsed += Math.floor((Date.now() - swStartTime) / 1000);
        swStartTime = null;
    }
    if (swElapsed > 0) saveSession("stopwatch", swElapsed);
}

function swReset() {
    swStop();
    swElapsed = 0;
    byId("laplist").innerHTML = "";
    swUpdate();
}

function swLap() {
    let elapsed = swElapsed;
    if (swStartTime !== null) {
        elapsed = swElapsed + Math.floor((Date.now() - swStartTime) / 1000);
    }
    const li = document.createElement("li");
    li.textContent = formatHMS(elapsed);
    byId("laplist").prepend(li);
}

setInterval(swUpdate, 200);

let pTime = 25 * 60,
    pRun = null,
    isBreak = false;
let pTotalDuration = 25 * 60;

function updateP() {
    byId("pomo").textContent = `${pad2(Math.floor(pTime / 60))}:${pad2(pTime % 60)}`;
}

function setDuration() {
    const w = parseInt(byId("workMin").value);
    const b = parseInt(byId("breakMin").value);
    pTotalDuration = (isBreak ? b : w) * 60;
    pTime = pTotalDuration;
}

function toggleMode() {
    isBreak = !isBreak;
    setDuration();
}

function savePartialWork() {
    if (!isBreak && pTime < pTotalDuration) {
        const elapsed = pTotalDuration - pTime;
        if (elapsed > 0) {
            saveSession("work", elapsed);
        }
    }
}

function pStart() {
    if (pRun) return;
    pRun = setInterval(() => {
        pTime--;
        if (pTime <= 0) {
            if (!isBreak) {
                saveSession("work", pTotalDuration);
            } else {
                saveSession("break", pTotalDuration);
            }
            toggleMode();
            if (!byId("autoNext").checked) pPause();
        }
        updateP();
    }, 1000);
}

function pPause() {
    clearInterval(pRun);
    pRun = null;
}

function pReset() {
    pPause();
    savePartialWork();
    isBreak = false;
    setDuration();
    updateP();
}

function pSkip() {
    pPause();
    savePartialWork();
    toggleMode();
    updateP();
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
let calYear, calMonth;

function initCalendar() {
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    renderCalendarGrid();
    byId("prevMonthBtn").onclick = () => changeMonth(-1);
    byId("nextMonthBtn").onclick = () => changeMonth(1);
    byId("closeModalBtn").onclick = closeModal;
    byId("modalBackdrop").addEventListener("click", (e) => {
        if (e.target.id === "modalBackdrop") closeModal();
    });
}

function changeMonth(delta) {
    calMonth += delta;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendarGrid();
}

function renderCalendarGrid() {
    byId("monthLabel").textContent = MONTHS[calMonth];
    byId("yearLabel").textContent = calYear;
    const grid = byId("calendarGrid");
    grid.innerHTML = "";
    WEEKDAYS.forEach(d => {
        const el = document.createElement("div");
        el.className = "weekday";
        el.textContent = d;
        grid.appendChild(el);
    });
    const first = new Date(calYear, calMonth, 1);
    const last = new Date(calYear, calMonth + 1, 0);
    const daysInMonth = last.getDate();
    let startOffset = first.getDay();
    if (startOffset === 0) startOffset = 7;
    const blanks = startOffset - 1;
    for (let i = 0; i < blanks; i++) {
        const blank = document.createElement("div");
        blank.className = "day day-blank";
        blank.style.visibility = "hidden";
        grid.appendChild(blank);
    }
    const todayKey = toDateKey(new Date());
    const history = loadHistory();
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement("div");
        cell.className = "day";
        const thisDate = new Date(calYear, calMonth, d);
        const key = toDateKey(thisDate);
        if (key === todayKey) cell.classList.add("today");
        let focusedSec = 0;
        history.forEach(h => {
            const dk = h.dayKey || toDateKey(h.date);
            if (dk === key && (h.type === "stopwatch" || h.type === "work")) {
                focusedSec += (h.duration || 0);
            }
        });
        const dateEl = document.createElement("div");
        dateEl.className = "date";
        dateEl.textContent = d;
        const sumEl = document.createElement("div");
        sumEl.className = "sum";
        sumEl.textContent = focusedSec > 0 ? `Total: ${formatHMS(focusedSec)}` : "—";
        cell.appendChild(dateEl);
        cell.appendChild(sumEl);
        cell.onclick = () => openDayModal(key, thisDate);
        grid.appendChild(cell);
    }
}

function openDayModal(dayKey, dateObj) {
    const history = loadHistory().map((h, idx) => ({ ...h, __index: idx }))
        .sort((a, b) => (a.epoch || 0) - (b.epoch || 0));
    const sessions = history.filter(h => (h.dayKey || toDateKey(h.date)) === dayKey);
    byId("modalDateLabel").textContent = `${dayKey} — ${sessions.length} session${sessions.length !== 1 ? "s" : ""}`;
    const box = byId("modalContent");
    box.innerHTML = "";
    if (!sessions.length) {
        const empty = document.createElement("div");
        empty.style.padding = "14px";
        empty.textContent = "No sessions on this day.";
        box.appendChild(empty);
    } else {
        const header = document.createElement("div");
        header.className = "session-row";
        header.innerHTML = `
         <div class="session-type">TYPE</div>
         <div class="session-dur">DURATION</div>
         <div class="session-date">TIME</div>
         <div class="session-del">ACTION</div>
       `;
        box.appendChild(header);
        sessions.forEach(h => {
            const row = document.createElement("div");
            row.className = "session-row";
            const type = document.createElement("div");
            type.className = "session-type";
            type.textContent = h.type.toUpperCase();
            const dur = document.createElement("div");
            dur.className = "session-dur";
            const sec = h.duration || 0;
            dur.textContent = `${formatHMS(sec)}  (${sec}s)`;
            const time = document.createElement("div");
            time.className = "session-date";
            const d = h.epoch ? new Date(h.epoch) : new Date(h.date);
            time.textContent = d.toLocaleTimeString();
            const del = document.createElement("div");
            del.className = "session-del";
            const btn = document.createElement("button");
            btn.textContent = "Delete";
            btn.onclick = () => deleteHistoryEntry(h.__index, dayKey, dateObj);
            del.appendChild(btn);
            row.appendChild(type);
            row.appendChild(dur);
            row.appendChild(time);
            row.appendChild(del);
            box.appendChild(row);
        });
    }
    byId("modalBackdrop").classList.remove("hidden");
}

function closeModal() {
    byId("modalBackdrop").classList.add("hidden");
}

function deleteHistoryEntry(index, dayKey, dateObj) {
    const history = loadHistory();
    if (index >= 0 && index < history.length) {
        history.splice(index, 1);
        saveHistoryArray(history);
        renderCalendarGrid();
        updateTodayWeekTotals();
        openDayModal(dayKey, dateObj);
    }
}

function updateTodayWeekTotals() {
    const history = loadHistory();
    const now = new Date();
    const todayKey = toDateKey(now);
    let todaySec = 0;
    history.forEach(h => {
        const dk = h.dayKey || toDateKey(h.date);
        if (dk === todayKey && (h.type === "stopwatch" || h.type === "work")) {
            todaySec += (h.duration || 0);
        }
    });
    const monday = startOfWeek(now);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    let weekSec = 0;
    history.forEach(h => {
        const t = h.epoch ? new Date(h.epoch) : new Date(h.date);
        if (t >= monday && t <= sunday && (h.type === "stopwatch" || h.type === "work")) {
            weekSec += (h.duration || 0);
        }
    });
    byId("todayTotal").textContent = formatHMS(todaySec);
    byId("weekTotal").textContent = formatHMS(weekSec);
}

byId("swStartBtn").onclick = swStart;
byId("swStopBtn").onclick = swStop;
byId("swLapBtn").onclick = swLap;
byId("swResetBtn").onclick = swReset;

byId("pStartBtn").onclick = pStart;
byId("pPauseBtn").onclick = pPause;
byId("pSkipBtn").onclick = pSkip;
byId("pResetBtn").onclick = pReset;

byId("clearHistoryBtn").onclick = () => {
    localStorage.removeItem("studyHistory");
    renderCalendarGrid();
    updateTodayWeekTotals();
    alert((localStorage.getItem("appLanguage") || "en") === "hi" ? "हिस्ट्री साफ कर दी गई!" : "History cleared!");
};

window.onload = () => {
    const savedLang = localStorage.getItem("appLanguage") || "en";
    byId("langSelect").value = savedLang;
    applyLanguage(savedLang);
    initCalendar();
    updateTodayWeekTotals();
    updateClock();
    setInterval(updateClock, 1000);
    swUpdate();
    setDuration();
    updateP();
};
