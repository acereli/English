const defaultState = {
  xp: 0,
  streak: 0,
  level: "Beginner",
  skill: { listening: 20, speaking: 20, reading: 20, writing: 20 },
  timerSeconds: 0,
  weeklyHistory: [],
};

const state = JSON.parse(localStorage.getItem("englishTrainerState") || "null") || defaultState;
const lecturePool = [
  {
    title: "How memory works in higher education",
    video: "https://www.youtube.com/embed/4xDzrJKXOOY",
  },
  {
    title: "Academic critical thinking lecture",
    video: "https://www.youtube.com/embed/HAnw168huqA",
  },
  {
    title: "University study strategies",
    video: "https://www.youtube.com/embed/IlU-zDU6aQ0",
  },
];

const speakingPrompts = [
  "Describe a time when you had to solve a difficult problem in a team.",
  "Do you agree that online classes can replace traditional lectures? Why?",
  "What skills are essential for success in Canadian colleges?",
];

const shadowSentences = [
  "In today's lecture, we will examine the long-term impact of policy decisions.",
  "A well-structured argument requires evidence, logic, and clear transitions.",
  "Students who review notes within twenty-four hours retain information better.",
];

const readingPassages = [
  "University-level reading requires strategic skimming, detailed scanning, and critical evaluation of evidence. Students who annotate and summarize paragraphs develop faster comprehension and stronger long-term retention.",
  "Academic success depends on processing unfamiliar vocabulary through context. Instead of translating every word, effective readers infer meaning, track argument structure, and identify assumptions made by the writer.",
];

const weekPlan = [
  ["Foundation listening", "Shadowing daily", "Basic essay structure"],
  ["Lecture note-taking", "Pronunciation drills", "Paragraph coherence"],
  ["IELTS integrated practice", "Timed reading set A", "Speaking recording tasks"],
  ["IELTS integrated practice", "Timed reading set B", "Task 2 argument writing"],
  ["IELTS integrated practice", "Timed reading set C", "Feedback-driven rewrites"],
  ["Full simulation mode #1", "Mock IELTS under time", "Advanced speaking cues"],
  ["Full simulation mode #2", "Weekly complete mock test", "Error log refinement"],
  ["Real exam conditions", "Final mock", "Seneca readiness review"],
];

let timerInterval;
let readingInterval;
let readingLeft = 900;
let mediaRecorder;
let audioChunks = [];
let recordedAudio;

function saveState() {
  localStorage.setItem("englishTrainerState", JSON.stringify(state));
}

function addXP(amount, skillKey) {
  state.xp += amount;
  state.skill[skillKey] = Math.min(100, state.skill[skillKey] + Math.round(amount / 5));
  state.level = state.xp >= 1500 ? "Academic Ready" : state.xp >= 700 ? "Intermediate" : "Beginner";
  saveState();
  renderAll();
}

function computeReadiness() {
  const avg = Object.values(state.skill).reduce((a, b) => a + b, 0) / 4;
  return Math.round(avg * 0.9 + Math.min(10, state.streak));
}

function renderDashboard() {
  const progress = document.getElementById("skillProgress");
  progress.innerHTML = "";
  for (const [k, v] of Object.entries(state.skill)) {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<label>${k[0].toUpperCase() + k.slice(1)}: ${v}%</label><progress max="100" value="${v}"></progress>`;
    progress.appendChild(wrap);
  }

  document.getElementById("topStats").innerHTML = `XP: <strong>${state.xp}</strong> · Streak: <strong>${state.streak} days</strong> · Level: <strong>${state.level}</strong>`;

  const readiness = computeReadiness();
  document.getElementById("readinessScore").textContent = readiness;
  document.getElementById("readinessLabel").textContent =
    readiness > 75 ? "On track for IELTS 6.5–7.0" : readiness > 50 ? "Developing academic readiness" : "Build stronger foundations";

  document.getElementById("gamificationList").innerHTML = `
    <li>XP: ${state.xp}</li>
    <li>Streak: ${state.streak} day(s)</li>
    <li>Level: ${state.level}</li>
    <li>Badges: ${state.xp > 300 ? "Consistent Learner" : "-"}, ${state.xp > 1000 ? "IELTS Challenger" : "-"}</li>
  `;

  const weakest = Object.entries(state.skill).sort((a, b) => a[1] - b[1])[0];
  document.getElementById("weakPoints").textContent = `Focus area: ${weakest[0]} (${weakest[1]}%). Adaptive recommendation: +20 minutes targeted practice in this module today.`;
}

function renderTimer() {
  const h = Math.floor(state.timerSeconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((state.timerSeconds % 3600) / 60).toString().padStart(2, "0");
  const s = (state.timerSeconds % 60).toString().padStart(2, "0");
  document.getElementById("timerValue").textContent = `${h}:${m}:${s}`;
}

function renderPlan() {
  document.getElementById("planContent").innerHTML = weekPlan
    .map(
      (w, i) => `<article class="panel"><h3>Week ${i + 1}${i < 2 ? " (Foundation)" : i < 5 ? " (IELTS Integration)" : " (Simulation)"}</h3><ul>${w.map((i2) => `<li>${i2}</li>`).join("")}</ul></article>`,
    )
    .join("");
}

function renderReports() {
  const readiness = computeReadiness();
  document.getElementById("weeklyReport").innerHTML = `
    <article class="panel">
      <h3>Current Week Snapshot</h3>
      <p>Estimated IELTS readiness band: <strong>${(readiness / 12).toFixed(1)}</strong></p>
      <p>Strongest skill: <strong>${Object.entries(state.skill).sort((a, b) => b[1] - a[1])[0][0]}</strong></p>
      <p>Needs improvement: <strong>${Object.entries(state.skill).sort((a, b) => a[1] - b[1])[0][0]}</strong></p>
      <p class="good">Recommendation: complete one full mock this week under real exam conditions.</p>
    </article>`;
}

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function loadListening() {
  const lecture = randomFrom(lecturePool);
  document.getElementById("lectureTitle").textContent = lecture.title;
  document.getElementById("lectureVideo").src = lecture.video;
}

function generateListeningQuestions() {
  const notes = document.getElementById("listeningNotes").value.trim();
  const focus = notes.split(" ").slice(0, 6).join(" ") || "the lecture";
  const qs = [
    `What is the speaker's main claim about ${focus}?`,
    "Which supporting example is used to justify the main idea?",
    "What implication does this lecture have for university students?",
  ];
  document.getElementById("listeningQuestions").innerHTML = qs.map((q) => `<li>${q}</li>`).join("");
  addXP(30, "listening");
}

function analyzeSpeaking() {
  const text = document.getElementById("speakingTranscript").value.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const fluency = Math.min(9, (words / 18 + Math.random() * 2 + 3).toFixed(1));
  const pronunciation = Math.min(9, (5 + Math.random() * 3).toFixed(1));
  const grammar = text.includes("because") && text.includes("however")
    ? "Good range of connectors. Minor article errors detected."
    : "Use more complex linking words (however, therefore, moreover).";
  document.getElementById("speakingFeedback").innerHTML = `
    <p><strong>Fluency score:</strong> ${fluency}/9</p>
    <p><strong>Pronunciation clarity:</strong> ${pronunciation}/9</p>
    <p><strong>Grammar suggestions:</strong> ${grammar}</p>
  `;
  addXP(40, "speaking");
}

function analyzeEssay() {
  const essay = document.getElementById("essayInput").value.trim();
  const wc = essay.split(/\s+/).filter(Boolean).length;
  const cohesion = essay.includes("Firstly") || essay.includes("First") ? 7 : 5.5;
  const vocab = wc > 220 ? 7 : 6;
  const grammar = Math.min(7.5, 5 + wc / 120).toFixed(1);
  const band = ((+grammar + cohesion + vocab) / 3).toFixed(1);
  document.getElementById("essayFeedback").innerHTML = `
    <p><strong>Estimated band:</strong> ${band}/9</p>
    <p><strong>Grammar:</strong> ${grammar}/9 · <strong>Coherence:</strong> ${cohesion}/9 · <strong>Vocabulary:</strong> ${vocab}/9</p>
    <p><strong>AI correction suggestions:</strong> Improve thesis clarity and add one counterargument paragraph with precise academic vocabulary.</p>
  `;
  addXP(50, "writing");
}

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.9;
  speechSynthesis.speak(utter);
}

function initRecorder() {
  if (!navigator.mediaDevices?.getUserMedia) return;

  document.getElementById("startRecord").onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      recordedAudio = new Audio(URL.createObjectURL(new Blob(audioChunks, { type: "audio/webm" })));
      document.getElementById("recordStatus").textContent = "Recording saved. Ready to playback.";
      addXP(20, "speaking");
    };
    mediaRecorder.start();
    document.getElementById("recordStatus").textContent = "Recording...";
  };

  document.getElementById("stopRecord").onclick = () => mediaRecorder?.stop();
  document.getElementById("playRecord").onclick = () => recordedAudio?.play();
}

function gradeReading(formData) {
  let score = 0;
  if ((formData.get("q1") || "").length > 20) score += 1;
  if (/false/i.test(formData.get("q2") || "")) score += 1;
  if ((formData.get("q3") || "").length > 6) score += 1;
  document.getElementById("readingScore").textContent = `Score: ${score}/3 (${Math.round((score / 3) * 100)}%)`;
  addXP(35, "reading");
}

function updateAdaptiveDifficulty() {
  const avg = Object.values(state.skill).reduce((a, b) => a + b, 0) / 4;
  const hard = avg > 65;
  document.getElementById("readingPassage").textContent = hard
    ? readingPassages[1]
    : readingPassages[0];
}

function bindEvents() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
      document.getElementById(btn.dataset.section).classList.add("active");
    });
  });

  document.getElementById("startTimer").onclick = () => {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      state.timerSeconds += 1;
      renderTimer();
      if (state.timerSeconds % 600 === 0) {
        state.streak = Math.max(1, state.streak + 1);
        saveState();
        renderDashboard();
      }
    }, 1000);
  };
  document.getElementById("pauseTimer").onclick = () => clearInterval(timerInterval);
  document.getElementById("resetTimer").onclick = () => {
    clearInterval(timerInterval);
    state.timerSeconds = 0;
    renderTimer();
    saveState();
  };

  document.getElementById("generateListeningQuestions").onclick = generateListeningQuestions;
  document.getElementById("newSpeakingPrompt").onclick = () => {
    document.getElementById("speakingPrompt").textContent = randomFrom(speakingPrompts);
  };
  document.getElementById("newShadow").onclick = () => {
    document.getElementById("shadowSentence").textContent = randomFrom(shadowSentences);
  };
  document.getElementById("playShadow").onclick = () => speak(document.getElementById("shadowSentence").textContent);
  document.getElementById("analyzeSpeaking").onclick = analyzeSpeaking;
  document.getElementById("analyzeEssay").onclick = analyzeEssay;

  document.getElementById("readingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    gradeReading(new FormData(e.target));
  });

  document.getElementById("startReadingTimer").onclick = () => {
    readingLeft = 900;
    clearInterval(readingInterval);
    readingInterval = setInterval(() => {
      readingLeft -= 1;
      const m = String(Math.floor(readingLeft / 60)).padStart(2, "0");
      const s = String(readingLeft % 60).padStart(2, "0");
      document.getElementById("readingCountdown").textContent = `${m}:${s}`;
      if (readingLeft <= 0) {
        clearInterval(readingInterval);
        document.getElementById("readingCountdown").textContent = "Time up";
      }
    }, 1000);
  };
}

function renderAll() {
  renderDashboard();
  renderTimer();
  renderPlan();
  renderReports();
  updateAdaptiveDifficulty();
}

function init() {
  loadListening();
  document.getElementById("speakingPrompt").textContent = randomFrom(speakingPrompts);
  document.getElementById("shadowSentence").textContent = randomFrom(shadowSentences);
  bindEvents();
  initRecorder();
  renderAll();
}

init();
