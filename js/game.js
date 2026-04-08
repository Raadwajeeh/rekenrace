const ELEMENTS = {
  startButton: document.getElementById("start-btn"),
  restartButton: document.getElementById("restart-btn"),
  instructionButton: document.getElementById("instruction-btn"),
  soundButtonSetup: document.getElementById("sound-btn"),
  soundButtonGame: document.getElementById("sound-btn-game"),
  menuButton: document.getElementById("menu-btn"),
  closeModalButton: document.getElementById("close-modal-btn"),
  difficultySelect: document.getElementById("difficulty-select"),
  modeSelect: document.getElementById("mode-select"),
  ageGroupSelect: document.getElementById("age-group-select"),
  setupScreen: document.getElementById("setup-screen"),
  gameScreen: document.getElementById("game-screen"),
  selectedSummary: document.getElementById("selected-summary"),
  score: document.getElementById("score"),
  timer: document.getElementById("timer"),
  level: document.getElementById("level"),
  streak: document.getElementById("streak"),
  adaptiveStatus: document.getElementById("adaptive-status"),
  feedback: document.getElementById("feedback"),
  question: document.getElementById("question"),
  questionHelp: document.getElementById("question-help"),
  questionCounter: document.getElementById("question-counter"),
  modeLabel: document.getElementById("mode-label"),
  trackProgress: document.getElementById("track-progress"),
  statusBadge: document.getElementById("status-badge"),
  miniProgressFill: document.getElementById("mini-progress-fill"),
  timeBarFill: document.getElementById("time-bar-fill"),
  correctCount: document.getElementById("correct-count"),
  wrongCount: document.getElementById("wrong-count"),
  goalCount: document.getElementById("goal-count"),
  car: document.getElementById("car"),
  finish: document.getElementById("finish"),
  track: document.getElementById("track"),
  mathRain: document.getElementById("math-rain"),
  answerButtons: Array.from(document.querySelectorAll(".answer-btn")),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modal-title"),
  modalText: document.getElementById("modal-text"),
  modalEmoji: document.getElementById("modal-emoji")
};

const AUDIO = {
  correct: new Audio("assets/correct.mp3"),
  wrong: new Audio("assets/wrong.mp3"),
  background: new Audio("assets/bg-loop.wav")
};

AUDIO.background.loop = true;
AUDIO.background.volume = 0.18;

const GAME = {
  maxLevel: 3,
  questionsPerLevel: 5,
  carStartLeft: 12,
  defaultAdaptiveStage: 0,
  answerDelay: 700,
  adaptiveLabels: ["Basis", "Sneller", "Slimmer", "Expert"],
  modeLabels: {
    mix: "Mix",
    add: "Optellen",
    subtract: "Aftrekken",
    multiply: "Vermenigvuldigen"
  },
  difficultySettings: {
    easy: {
      label: "Makkelijk",
      timePerQuestion: 14,
      add: [1, 12],
      subtract: [4, 14],
      multiply: [1, 5]
    },
    normal: {
      label: "Normaal",
      timePerQuestion: 12,
      add: [4, 20],
      subtract: [6, 22],
      multiply: [2, 8]
    },
    hard: {
      label: "Moeilijk",
      timePerQuestion: 10,
      add: [8, 35],
      subtract: [10, 35],
      multiply: [3, 10]
    }
  },
  ageOffsets: {
    group5: { add: -2, subtract: -2, multiply: -1, text: "Groep 5" },
    group6: { add: 0, subtract: 0, multiply: 0, text: "Groep 6" },
    group7: { add: 3, subtract: 3, multiply: 1, text: "Groep 7" },
    group8: { add: 6, subtract: 6, multiply: 2, text: "Groep 8" }
  }
};

const state = {
  score: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  answeredQuestions: 0,
  currentAnswer: null,
  currentQuestionText: "",
  gameRunning: false,
  soundEnabled: true,
  audioUnlocked: false,
  timerId: null,
  questionTimeLeft: 0,
  adaptiveStage: GAME.defaultAdaptiveStage,
  recentResults: [],
  difficulty: ELEMENTS.difficultySelect.value,
  mode: ELEMENTS.modeSelect.value,
  ageGroup: ELEMENTS.ageGroupSelect.value
};

bindEvents();
createMathRain();
resetGameState(false);
showSetupScreen();
render();

function bindEvents() {
  ELEMENTS.startButton.addEventListener("click", startGame);
  ELEMENTS.restartButton.addEventListener("click", restartGame);
  ELEMENTS.instructionButton.addEventListener("click", showInstructions);
  ELEMENTS.soundButtonSetup.addEventListener("click", toggleSound);
  ELEMENTS.soundButtonGame.addEventListener("click", toggleSound);
  ELEMENTS.menuButton.addEventListener("click", returnToMenu);
  ELEMENTS.closeModalButton.addEventListener("click", closeModal);
  ELEMENTS.difficultySelect.addEventListener("change", handleSettingChange);
  ELEMENTS.modeSelect.addEventListener("change", handleSettingChange);
  ELEMENTS.ageGroupSelect.addEventListener("change", handleSettingChange);
  ELEMENTS.answerButtons.forEach((button) => button.addEventListener("click", handleAnswerClick));
  window.addEventListener("resize", updateCarPosition);
}

function createMathRain() {
  const symbols = ["7 + 5", "8 × 2", "15 - 6", "4 + 11", "6 × 4", "21 - 9", "14 + 3", "9 × 3"];
  ELEMENTS.mathRain.innerHTML = "";

  for (let index = 0; index < 24; index += 1) {
    const item = document.createElement("span");
    item.className = "math-item";
    item.textContent = symbols[index % symbols.length];
    item.style.left = `${Math.random() * 100}%`;
    item.style.animationDuration = `${10 + Math.random() * 12}s`;
    item.style.animationDelay = `${Math.random() * -16}s`;
    item.style.fontSize = `${16 + Math.random() * 16}px`;
    ELEMENTS.mathRain.appendChild(item);
  }
}

function handleSettingChange() {
  state.difficulty = ELEMENTS.difficultySelect.value;
  state.mode = ELEMENTS.modeSelect.value;
  state.ageGroup = ELEMENTS.ageGroupSelect.value;
  updateSelectedSummary();

  if (!state.gameRunning) {
    resetGameState(false);
    render();
  }
}

async function startGame() {
  closeModal();
  state.difficulty = ELEMENTS.difficultySelect.value;
  state.mode = ELEMENTS.modeSelect.value;
  state.ageGroup = ELEMENTS.ageGroupSelect.value;
  updateSelectedSummary();
  showGameScreen();
  resetGameState(true);
  state.gameRunning = true;
  state.currentQuestionText = "";
  setAnswerButtonsEnabled(true);
  ELEMENTS.feedback.textContent = "De race is gestart. Kies het juiste antwoord.";
  ELEMENTS.statusBadge.textContent = "Spel bezig";
  await startBackgroundMusic();
  generateNextQuestion();
  requestAnimationFrame(() => updateCarPosition(false));
  render();
}

function restartGame() {
  stopQuestionTimer();
  closeModal();
  startGame();
}

function returnToMenu() {
  stopQuestionTimer();
  stopBackgroundMusic();
  closeModal();
  resetGameState(false);
  showSetupScreen();
  render();
}

function showSetupScreen() {
  ELEMENTS.setupScreen.classList.remove("hidden");
  ELEMENTS.gameScreen.classList.add("hidden");
}

function showGameScreen() {
  ELEMENTS.setupScreen.classList.add("hidden");
  ELEMENTS.gameScreen.classList.remove("hidden");
}

function updateSelectedSummary() {
  ELEMENTS.selectedSummary.textContent = `${GAME.ageOffsets[state.ageGroup].text} • ${GAME.difficultySettings[state.difficulty].label} • ${GAME.modeLabels[state.mode]}`;
}

function resetGameState(keepSettings = true) {
  stopQuestionTimer();

  if (!keepSettings) {
    state.difficulty = ELEMENTS.difficultySelect.value;
    state.mode = ELEMENTS.modeSelect.value;
    state.ageGroup = ELEMENTS.ageGroupSelect.value;
  }

  state.score = 0;
  state.level = 1;
  state.streak = 0;
  state.bestStreak = 0;
  state.correctAnswers = 0;
  state.wrongAnswers = 0;
  state.answeredQuestions = 0;
  state.currentAnswer = null;
  state.currentQuestionText = "Klik op Start Game";
  state.gameRunning = false;
  state.questionTimeLeft = getQuestionTime();
  state.adaptiveStage = GAME.defaultAdaptiveStage;
  state.recentResults = [];

  resetAnswerButtons();
  setAnswerButtonsEnabled(false);
  ELEMENTS.question.textContent = "Klik op Start Game";
  ELEMENTS.questionHelp.textContent = "Je krijgt steeds vier antwoordmogelijkheden.";
  ELEMENTS.feedback.textContent = "Klik op Start Game om te beginnen.";
  ELEMENTS.statusBadge.textContent = "Klaar om te starten";
  updateSelectedSummary();
  syncSoundButtons();
}

function getQuestionTime() {
  return Math.max(5, GAME.difficultySettings[state.difficulty].timePerQuestion - state.adaptiveStage);
}

function generateNextQuestion() {
  if (!state.gameRunning) {
    return;
  }

  const operation = chooseOperation();
  const questionData = buildQuestion(operation);
  state.currentAnswer = questionData.answer;
  state.currentQuestionText = questionData.text;
  state.questionTimeLeft = getQuestionTime();

  ELEMENTS.question.textContent = questionData.text;
  ELEMENTS.questionHelp.textContent = `Level ${state.level} • ${GAME.ageOffsets[state.ageGroup].text} • ${GAME.modeLabels[state.mode]}`;
  showAnswers(createAnswerOptions(questionData.answer));
  startQuestionTimer();
  render();
}

function chooseOperation() {
  if (state.mode !== "mix") {
    return state.mode;
  }

  const operations = state.level === 1 ? ["add", "subtract"] : ["add", "subtract", "multiply"];
  return operations[randomInt(0, operations.length - 1)];
}

function buildQuestion(operation) {
  const range = getRangeForOperation(operation);
  const min = range[0];
  const max = range[1];
  let firstNumber;
  let secondNumber;
  let answer;
  let text;

  if (operation === "add") {
    firstNumber = randomInt(min, max);
    secondNumber = randomInt(min, max);
    answer = firstNumber + secondNumber;
    text = `${firstNumber} + ${secondNumber} = ?`;
  } else if (operation === "subtract") {
    firstNumber = randomInt(Math.max(min, 4), max + 4);
    secondNumber = randomInt(min, Math.max(min, firstNumber - 1));
    if (secondNumber > firstNumber) {
      secondNumber = firstNumber - 1;
    }
    answer = firstNumber - secondNumber;
    text = `${firstNumber} - ${secondNumber} = ?`;
  } else {
    firstNumber = randomInt(Math.max(1, min), max);
    secondNumber = randomInt(Math.max(1, min), max);
    answer = firstNumber * secondNumber;
    text = `${firstNumber} × ${secondNumber} = ?`;
  }

  if (text === state.currentQuestionText) {
    return buildQuestion(operation);
  }

  return { text, answer };
}

function getRangeForOperation(operation) {
  const settings = GAME.difficultySettings[state.difficulty];
  const offsets = GAME.ageOffsets[state.ageGroup];
  const levelBoost = state.level - 1;
  const adaptiveBoost = state.adaptiveStage;

  if (operation === "add") {
    return [
      Math.max(1, settings.add[0] + offsets.add),
      settings.add[1] + offsets.add + levelBoost * 4 + adaptiveBoost * 2
    ];
  }

  if (operation === "subtract") {
    return [
      Math.max(1, settings.subtract[0] + offsets.subtract),
      settings.subtract[1] + offsets.subtract + levelBoost * 4 + adaptiveBoost * 2
    ];
  }

  return [
    Math.max(1, settings.multiply[0] + offsets.multiply),
    settings.multiply[1] + offsets.multiply + levelBoost + adaptiveBoost
  ];
}

function createAnswerOptions(correctAnswer) {
  const options = [correctAnswer];
  const spread = state.difficulty === "hard" ? 14 : state.difficulty === "normal" ? 10 : 8;

  while (options.length < 4) {
    const variation = randomInt(-spread, spread);
    const option = correctAnswer + variation;

    if (option > 0 && option !== correctAnswer && !options.includes(option)) {
      options.push(option);
    }
  }

  return shuffleArray(options);
}

function showAnswers(options) {
  ELEMENTS.answerButtons.forEach((button, index) => {
    button.textContent = options[index];
    button.classList.remove("correct", "wrong", "timeout");
  });
}

function handleAnswerClick(event) {
  if (!state.gameRunning) {
    return;
  }

  const selectedButton = event.currentTarget;
  const selectedAnswer = Number(selectedButton.textContent);
  const isCorrect = selectedAnswer === state.currentAnswer;
  processAnswer(isCorrect, selectedButton);
}

function processAnswer(isCorrect, selectedButton = null, wasTimeout = false) {
  stopQuestionTimer();
  setAnswerButtonsEnabled(false);

  if (isCorrect) {
    state.score += calculatePoints();
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.correctAnswers += 1;
    state.answeredQuestions += 1;
    recordAdaptiveResult(true);
    ELEMENTS.feedback.textContent = `Goed gedaan. ${state.streak > 1 ? `Streak: ${state.streak}. ` : ""}De auto rijdt vooruit.`;
    ELEMENTS.questionHelp.textContent = "Sterk antwoord. Blijf zo doorgaan.";
    if (selectedButton) {
      selectedButton.classList.add("correct");
    }
    playSound(AUDIO.correct);
    playTone(660, 0.12, "triangle");
    moveCarForward();
  } else {
    state.score = Math.max(0, state.score - 2);
    state.streak = 0;
    state.wrongAnswers += 1;
    state.answeredQuestions += 1;
    recordAdaptiveResult(false);
    ELEMENTS.feedback.textContent = wasTimeout
      ? `Te laat. Het goede antwoord was ${state.currentAnswer}.`
      : `Fout antwoord. Het goede antwoord was ${state.currentAnswer}.`;
    ELEMENTS.questionHelp.textContent = wasTimeout
      ? "Werk sneller of kies een makkelijkere instelling."
      : "Lees de som rustig en probeer de volgende vraag.";
    if (selectedButton) {
      selectedButton.classList.add(wasTimeout ? "timeout" : "wrong");
    }
    playSound(AUDIO.wrong);
    playTone(wasTimeout ? 180 : 220, 0.18, "sawtooth");
  }

  render();

  if (!state.gameRunning) {
    return;
  }

  if (state.correctAnswers >= getTotalGoal()) {
    finishGame(true);
    return;
  }

  if (state.correctAnswers > 0 && state.correctAnswers % GAME.questionsPerLevel === 0 && state.level < GAME.maxLevel) {
    state.level += 1;
    state.currentQuestionText = "";
    ELEMENTS.statusBadge.textContent = `Level ${state.level}`;
    showModal(`Level ${state.level}`, `Goed bezig. Je gaat nu door naar level ${state.level}.`, "🚦");
    playWinJingle();
  }

  setTimeout(() => {
    if (!state.gameRunning) {
      return;
    }
    resetAnswerButtons();
    setAnswerButtonsEnabled(true);
    generateNextQuestion();
  }, GAME.answerDelay);
}

function calculatePoints() {
  const streakBonus = Math.min(state.streak, 4);
  const levelBonus = state.level * 2;
  return 10 + streakBonus + levelBonus;
}

function recordAdaptiveResult(isCorrect) {
  state.recentResults.push(isCorrect ? 1 : 0);
  if (state.recentResults.length > 5) {
    state.recentResults.shift();
  }

  const successes = state.recentResults.reduce((sum, result) => sum + result, 0);
  if (state.recentResults.length >= 4 && successes >= 4) {
    state.adaptiveStage = Math.min(state.adaptiveStage + 1, GAME.adaptiveLabels.length - 1);
    state.recentResults = [];
  } else if (state.recentResults.length >= 4 && successes <= 1) {
    state.adaptiveStage = Math.max(state.adaptiveStage - 1, 0);
    state.recentResults = [];
  }
}

function startQuestionTimer() {
  stopQuestionTimer();
  renderTimeBar();

  state.timerId = window.setInterval(() => {
    if (!state.gameRunning) {
      return;
    }

    state.questionTimeLeft -= 1;
    renderTimeBar();
    ELEMENTS.timer.textContent = `${state.questionTimeLeft} sec`;

    if (state.questionTimeLeft <= 3 && state.questionTimeLeft > 0) {
      ELEMENTS.feedback.textContent = `Snel. Nog ${state.questionTimeLeft} seconden over.`;
      playTone(740, 0.06, "triangle");
    }

    if (state.questionTimeLeft <= 0) {
      const timeoutButton = ELEMENTS.answerButtons.find((button) => Number(button.textContent) !== state.currentAnswer) || null;
      processAnswer(false, timeoutButton, true);
    }
  }, 1000);
}

function stopQuestionTimer() {
  window.clearInterval(state.timerId);
  state.timerId = null;
}

function moveCarForward() {
  updateCarPosition(true);
  ELEMENTS.car.classList.remove("bump");
  ELEMENTS.car.classList.add("bump");
  window.setTimeout(() => ELEMENTS.car.classList.remove("bump"), 250);
}

function updateCarPosition(animate = false) {
  if (ELEMENTS.gameScreen.classList.contains("hidden")) {
    return;
  }

  const trackWidth = ELEMENTS.track.clientWidth;
  if (!trackWidth) {
    return;
  }

  const finishWidth = ELEMENTS.finish.offsetWidth || 70;
  const carWidth = ELEMENTS.car.offsetWidth || 80;
  const maxLeft = trackWidth - finishWidth - carWidth - 20;
  const progress = getProgressRatio();
  const newLeft = GAME.carStartLeft + progress * (maxLeft - GAME.carStartLeft);

  if (!animate) {
    ELEMENTS.car.style.transition = "none";
    ELEMENTS.car.style.left = `${newLeft}px`;
    requestAnimationFrame(() => {
      ELEMENTS.car.style.transition = "left 0.55s cubic-bezier(.22, .61, .36, 1), transform 0.2s ease";
    });
    return;
  }

  ELEMENTS.car.style.left = `${newLeft}px`;
}

function getProgressRatio() {
  return Math.min(state.correctAnswers / getTotalGoal(), 1);
}

function getTotalGoal() {
  return GAME.maxLevel * GAME.questionsPerLevel;
}

function finishGame(won) {
  stopQuestionTimer();
  state.gameRunning = false;
  setAnswerButtonsEnabled(false);
  stopBackgroundMusic();

  if (won) {
    ELEMENTS.feedback.textContent = `Gefeliciteerd. Je hebt de finish gehaald met ${state.score} punten.`;
    ELEMENTS.statusBadge.textContent = "Gewonnen";
    ELEMENTS.questionHelp.textContent = "Klik op Restart om opnieuw te spelen of ga terug naar het menu.";
    showModal("Gefeliciteerd", `Je hebt RekenRace gewonnen met ${state.score} punten en een beste streak van ${state.bestStreak}.`, "🏆");
    playWinJingle();
  } else {
    ELEMENTS.feedback.textContent = "Het spel is gestopt.";
    ELEMENTS.statusBadge.textContent = "Game Over";
    ELEMENTS.questionHelp.textContent = "Klik op Restart om opnieuw te spelen of ga terug naar het menu.";
    showModal("Game Over", `Je eindscore is ${state.score} punten. Probeer opnieuw voor een betere race.`, "😵");
  }

  render();
}

function render() {
  ELEMENTS.score.textContent = `${state.score} punten`;
  ELEMENTS.timer.textContent = `${state.questionTimeLeft} sec`;
  if (ELEMENTS.level) ELEMENTS.level.textContent = `Level ${state.level}`;
  if (ELEMENTS.streak) ELEMENTS.streak.textContent = `Streak ${state.streak}`;
  if (ELEMENTS.adaptiveStatus) ELEMENTS.adaptiveStatus.textContent = GAME.adaptiveLabels[state.adaptiveStage];
  ELEMENTS.questionCounter.textContent = `Vraag ${state.answeredQuestions + (state.gameRunning ? 1 : 0)} / ${getTotalGoal()}`;
  ELEMENTS.modeLabel.textContent = GAME.modeLabels[state.mode];
  ELEMENTS.trackProgress.textContent = `${Math.round(getProgressRatio() * 100)}%`;
  ELEMENTS.correctCount.textContent = `${state.correctAnswers}`;
  ELEMENTS.wrongCount.textContent = `${state.wrongAnswers}`;
  ELEMENTS.goalCount.textContent = `${getTotalGoal()}`;
  ELEMENTS.miniProgressFill.style.width = `${getProgressRatio() * 100}%`;
  renderTimeBar();
  updateSelectedSummary();
  syncSoundButtons();
  updateCarPosition();
}

function renderTimeBar() {
  const questionTime = getQuestionTime();
  const ratio = Math.max(0, Math.min(state.questionTimeLeft / questionTime, 1));
  ELEMENTS.timeBarFill.style.width = `${ratio * 100}%`;

  if (ratio > 0.5) {
    ELEMENTS.timeBarFill.style.background = "linear-gradient(90deg, #22c55e, #84cc16)";
  } else if (ratio > 0.25) {
    ELEMENTS.timeBarFill.style.background = "linear-gradient(90deg, #facc15, #f59e0b)";
  } else {
    ELEMENTS.timeBarFill.style.background = "linear-gradient(90deg, #fb7185, #ef4444)";
  }
}

function setAnswerButtonsEnabled(enabled) {
  ELEMENTS.answerButtons.forEach((button) => {
    button.disabled = !enabled;
  });
}

function resetAnswerButtons() {
  ELEMENTS.answerButtons.forEach((button) => {
    button.classList.remove("correct", "wrong", "timeout");
  });
}

function showInstructions() {
  showModal(
    "Instructie",
    "Kies eerst groep, moeilijkheid en soort som. Na Start Game verschijnt alleen het speelscherm. Beantwoord iedere som binnen de timer. Goed antwoord: score omhoog en auto vooruit. Fout antwoord of te laat: geen vooruitgang en puntenaftrek. Door goede reeksen past het spel zich automatisch aan.",
    "📘"
  );
}

function showModal(title, text, emoji) {
  ELEMENTS.modalTitle.textContent = title;
  ELEMENTS.modalText.textContent = text;
  ELEMENTS.modalEmoji.textContent = emoji;
  ELEMENTS.modal.classList.remove("hidden");
  ELEMENTS.modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  ELEMENTS.modal.classList.add("hidden");
  ELEMENTS.modal.setAttribute("aria-hidden", "true");
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  syncSoundButtons();

  if (!state.soundEnabled) {
    stopBackgroundMusic();
  } else if (state.gameRunning) {
    startBackgroundMusic();
  }
}

function syncSoundButtons() {
  const label = state.soundEnabled ? "Geluid aan" : "Geluid uit";
  const icon = state.soundEnabled ? "🔊" : "🔈";
  ELEMENTS.soundButtonSetup.textContent = label;
  ELEMENTS.soundButtonGame.textContent = icon;
  ELEMENTS.soundButtonGame.setAttribute("aria-label", label);
  ELEMENTS.soundButtonGame.title = label;
}

async function unlockAudio() {
  if (state.audioUnlocked) {
    return;
  }

  state.audioUnlocked = true;
  try {
    AUDIO.background.muted = true;
    await AUDIO.background.play();
    AUDIO.background.pause();
    AUDIO.background.currentTime = 0;
    AUDIO.background.muted = false;
  } catch (error) {
    AUDIO.background.muted = false;
  }
}

async function startBackgroundMusic() {
  if (!state.soundEnabled) {
    return;
  }

  await unlockAudio();

  try {
    AUDIO.background.currentTime = 0;
    await AUDIO.background.play();
  } catch (error) {
    // autoplay kan geblokkeerd zijn; spel blijft werken zonder achtergrondmuziek
  }
}

function stopBackgroundMusic() {
  AUDIO.background.pause();
  AUDIO.background.currentTime = 0;
}

function playSound(audioFile) {
  if (!state.soundEnabled) {
    return;
  }

  audioFile.currentTime = 0;
  audioFile.play().catch(() => {});
}

function playTone(frequency, duration, waveType = "sine") {
  if (!state.soundEnabled || !(window.AudioContext || window.webkitAudioContext)) {
    return;
  }

  const Context = window.AudioContext || window.webkitAudioContext;
  const audioContext = new Context();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = waveType;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = 0.04;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.stop(audioContext.currentTime + duration);

  window.setTimeout(() => {
    audioContext.close().catch(() => {});
  }, (duration + 0.05) * 1000);
}

function playWinJingle() {
  if (!state.soundEnabled) {
    return;
  }

  playTone(523.25, 0.12, "triangle");
  window.setTimeout(() => playTone(659.25, 0.12, "triangle"), 130);
  window.setTimeout(() => playTone(783.99, 0.18, "triangle"), 260);
}

function randomInt(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function shuffleArray(array) {
  const newArray = [...array];

  for (let index = newArray.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [newArray[index], newArray[swapIndex]] = [newArray[swapIndex], newArray[index]];
  }

  return newArray;
}
