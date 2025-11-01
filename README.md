# Focusflow

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pro-Focus Productivity Hub</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb {
      background-color: #3b82f6;
      border-radius: 10px;
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen p-4 md:p-8">

<!-- ✅ Firebase SDK Setup -->
<script type="module">
  // Import Firebase SDK (v11+ Modular)
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
  import { 
    getAuth, signInAnonymously, onAuthStateChanged 
  } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
  import { 
    getFirestore, collection, query, orderBy, onSnapshot, addDoc, 
    updateDoc, deleteDoc, doc, serverTimestamp 
  } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

  // ✅ Replace with your Firebase project's config (from Firebase Console)
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  window.db = db;
  window.auth = auth;
  window.userId = null;

  // 🔐 Anonymous Sign-In and Listener Setup
  async function initFirebase() {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Auth error:", error);
    }

    onAuthStateChanged(auth, (user) => {
      if (user) {
        window.userId = user.uid;
        console.log("User authenticated:", window.userId);
        initTaskListener();
      }
    });
  }

  initFirebase();

  // 🔁 Real-time listener for user tasks
  function getTasksCollection() {
    if (!window.userId) return null;
    return collection(db, `users/${window.userId}/tasks`);
  }

  function initTaskListener() {
    const tasksCol = getTasksCollection();
    const q = query(tasksCol, orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
      const tasks = [];
      snapshot.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));
      window.renderTasks(tasks);
    });
  }

  // 🧾 Firestore functions
  window.addTask = async function() {
    const input = document.getElementById('new-task-input');
    const title = input.value.trim();
    if (!title) return;

    const tasksCol = getTasksCollection();
    if (!tasksCol) return alert("Please wait, Firebase initializing...");

    await addDoc(tasksCol, {
      title,
      completed: false,
      createdAt: serverTimestamp()
    });

    input.value = '';
  };

  window.toggleTask = async function(taskId, isCompleted) {
    const ref = doc(db, `users/${window.userId}/tasks`, taskId);
    await updateDoc(ref, { completed: !isCompleted });
  };

  window.deleteTask = async function(taskId) {
    const ref = doc(db, `users/${window.userId}/tasks`, taskId);
    await deleteDoc(ref);
  };

</script>

<!-- ✅ Tone.js (for timer sounds) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js"></script>

<!-- ✅ App Layout (Timer + Tasks UI) -->
<div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

  <!-- Left Panel -->
  <div class="space-y-6 md:col-span-1">
    <!-- Timer -->
    <div id="timer-card" class="bg-white p-6 rounded-xl shadow-lg">
      <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <svg class="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span id="timer-mode-display">Focus Mode</span>
      </h2>
      <div class="text-center mb-6">
        <div id="timer-display" class="text-7xl font-extrabold text-blue-600">25:00</div>
        <p id="timer-message" class="text-sm text-gray-500 mt-2">Time to dive deep.</p>
      </div>
      <div class="flex justify-center space-x-4">
        <button id="start-btn" onclick="startTimer()" class="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full">Start</button>
        <button id="pause-btn" onclick="pauseTimer()" class="px-6 py-2 bg-yellow-500 text-white font-semibold rounded-full hidden">Pause</button>
        <button id="reset-btn" onclick="resetTimer()" class="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-full">Reset</button>
      </div>
    </div>

    <!-- Info -->
    <div class="bg-white p-4 rounded-xl shadow-inner text-sm text-gray-500">
      <p><strong>User ID:</strong> <span id="user-id-display" class="text-green-500 font-mono text-xs"></span></p>
    </div>
  </div>

  <!-- Right Panel -->
  <div class="md:col-span-2 bg-white p-6 rounded-xl shadow-lg flex flex-col">
    <h1 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
      <svg class="w-7 h-7 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
      Daily Tasks & Focus
    </h1>

    <!-- Input -->
    <div class="mb-6 flex space-x-3">
      <input id="new-task-input" type="text" class="flex-grow p-3 border rounded-lg" placeholder="Add a new task..." onkeydown="if(event.key==='Enter') addTask()">
      <button onclick="addTask()" class="px-4 py-3 bg-green-500 text-white rounded-lg">Add</button>
    </div>

    <!-- Tasks -->
    <div id="tasks-container" class="space-y-3 overflow-y-auto custom-scroll flex-grow">
      <p id="loading-indicator" class="text-center text-gray-500 py-12">Loading tasks...</p>
    </div>
  </div>
</div>

<script>
  // Timer logic (unchanged from your version)
  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;
  let timerMode = 'focus', timeRemaining = FOCUS_TIME, isRunning = false, timerInterval;
  const timerDisplay = document.getElementById('timer-display'),
        modeDisplay = document.getElementById('timer-mode-display'),
        timerMessage = document.getElementById('timer-message'),
        startBtn = document.getElementById('start-btn'),
        pauseBtn = document.getElementById('pause-btn');
  const synth = new Tone.MembraneSynth().toDestination();

  function formatTime(s){ return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
  function updateTimerDisplay(){ timerDisplay.textContent = formatTime(timeRemaining); }

  window.startTimer = function(){
    if(isRunning) return;
    isRunning = true;
    startBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    timerInterval = setInterval(()=>{
      timeRemaining--; updateTimerDisplay();
      if(timeRemaining<=0){ clearInterval(timerInterval); isRunning=false; synth.triggerAttackRelease("C4","8n"); switchMode(); startTimer(); }
    },1000);
  }
  window.pauseTimer=function(){ clearInterval(timerInterval); isRunning=false; startBtn.classList.remove('hidden'); pauseBtn.classList.add('hidden'); }
  window.resetTimer=function(){ pauseTimer(); timeRemaining=(timerMode==='focus'?FOCUS_TIME:BREAK_TIME); updateTimerDisplay(); }

  function switchMode(){
    timerMode = timerMode==='focus'?'break':'focus';
    timeRemaining = timerMode==='focus'?FOCUS_TIME:BREAK_TIME;
    modeDisplay.textContent = timerMode==='focus'?'Focus Mode':'Break Mode';
    timerMessage.textContent = timerMode==='focus'?'Time to dive deep.':'Relax and recharge!';
  }

  updateTimerDisplay();

  // Render tasks
  window.renderTasks = function(tasks){
    const c = document.getElementById('tasks-container');
    c.innerHTML='';
    document.getElementById('loading-indicator').style.display='none';
    document.getElementById('user-id-display').textContent=window.userId||'';
    if(!tasks.length){ c.innerHTML='<p class="text-center text-gray-400">No tasks yet!</p>'; return; }
    tasks.forEach(t=>{
      c.innerHTML+=`
        <div class="flex items-center p-3 border rounded-lg ${t.completed?'bg-green-50':''}">
          <input type="checkbox" ${t.completed?'checked':''} onchange="toggleTask('${t.id}',${t.completed})" class="h-5 w-5 text-green-600">
          <span class="ml-3 flex-grow ${t.completed?'line-through text-gray-500':''}">${t.title}</span>
          <button onclick="deleteTask('${t.id}')" class="ml-3 text-gray-400 hover:text-red-500">✕</button>
        </div>`;
    });
  };
</script>

</body>
</html>
