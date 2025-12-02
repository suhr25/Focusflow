/* -----STUDY HISTORY SYSTEM (localStorage)------------------- */

function saveSession(type, duration) {
  let history = JSON.parse(localStorage.getItem("studyHistory") || "[]");

  history.push({
    type: type,            
    duration: duration,    
    date: new Date().toLocaleString()
  });

  localStorage.setItem("studyHistory", JSON.stringify(history));
}

function showHistory() {
  let history = JSON.parse(localStorage.getItem("studyHistory") || "[]");

  if (history.length === 0) {
    alert("No study history yet!");
    return;
  }

  let msg = "📘 Study History:\n\n";

  history.forEach(h => {
    msg += `${h.date} — ${h.type.toUpperCase()} — ${(h.duration/60).toFixed(1)} mins\n`;
  });

  alert(msg);
}
/* ------------------------------------STOPWATCH LOGIC------------------------------------ */
let swTime = 0;
let swRun = null;

function swFormat(sec) {
  let h = String(Math.floor(sec / 3600)).padStart(2, "0");
  let m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  let s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function swUpdate() {
  document.getElementById("sw").textContent = swFormat(swTime);
}

function swStart() {
  if (swRun) return;
  swRun = setInterval(() => {
    swTime++;
    swUpdate();
  }, 1000);
}

function swStop() {
  clearInterval(swRun);
  swRun = null;

  if (swTime > 0) saveSession("stopwatch", swTime);
}

function swReset() {
  if (swTime > 0) saveSession("stopwatch", swTime);

  swStop();
  swTime = 0;
  swUpdate();
  document.getElementById("laplist").innerHTML = "";
}

function swLap() {
  let li = document.createElement("li");
  li.textContent = swFormat(swTime);
  document.getElementById("laplist").prepend(li);
}
/* ------------------------------------POMODORO LOGIC------------------------------------ */
let pTime = 25 * 60;
let pRun = null;
let isBreak = false;

function pFormat(sec) {
  let m = String(Math.floor(sec / 60)).padStart(2, "0");
  let s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function updateP() {
  document.getElementById("pomo").textContent = pFormat(pTime);
}

function setDuration() {
  let w = parseInt(document.getElementById("workMin").value);
  let b = parseInt(document.getElementById("breakMin").value);
  pTime = (isBreak ? b : w) * 60;
}

function toggleMode() {
  isBreak = !isBreak;
  setDuration();
}

function pStart() {
  if (pRun) return;

  pRun = setInterval(() => {
    pTime--;

    if (pTime <= 0) {
      if (!isBreak) {
        let w = parseInt(document.getElementById("workMin").value);
        saveSession("work", w * 60);
      } else {
        let b = parseInt(document.getElementById("breakMin").value);
        saveSession("break", b * 60);
      }
      toggleMode();

      if (!document.getElementById("autoNext").checked) {
        pPause();
      }
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
  isBreak = false;
  setDuration();
  updateP();
}

function pSkip() {
  pPause();
  toggleMode();
  updateP();
}


/* BUTTON EVENT LISTENERS*/

document.getElementById("swStartBtn").onclick = swStart;
document.getElementById("swStopBtn").onclick = swStop;
document.getElementById("swLapBtn").onclick = swLap;
document.getElementById("swResetBtn").onclick = swReset;

document.getElementById("pStartBtn").onclick = pStart;
document.getElementById("pPauseBtn").onclick = pPause;
document.getElementById("pSkipBtn").onclick = pSkip;
document.getElementById("pResetBtn").onclick = pReset;

document.getElementById("showHistoryBtn").onclick = showHistory;
document.getElementById("clearHistoryBtn").onclick = () => {
  localStorage.removeItem("studyHistory");
  alert("History cleared!");
};
