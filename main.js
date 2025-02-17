/****************************************************
 * MAIN.JS - All the JavaScript logic for our Roulette App
 ****************************************************/

/* =============== GLOBAL VARIABLES =============== */
let tableType = "european";
let selectedNumbers = [];
const minSpinsForHeatmap = 5;
let currentHeatmapLayout = null;

// Bankroll and betting settings
let bankroll = 1000;
let stakeStyle = "fixed"; // "fixed" or "percent"
let baseBet = 10;
let basePercent = 10;
let roundingFactor = 5; // 5 or 10
let betProgression = "martingale"; // "martingale", "fibonacci", or "padovan"

// For tracking consecutive losses (for progression systems)
let consecutiveLosses = 0;

// NEW: Let the user decide when to start betting
let bettingActive = false; // off by default

// Current bet suggestion
let currentBet = {
  betType: null, // "line" or "column"
  betTarget: null, // e.g. "Line 3" or "Column 2"
  betSize: 0,
};

// Define line groups
const lineGroups = [
  { name: "Line 1", numbers: ["1", "2", "3", "4", "5", "6"] },
  { name: "Line 2", numbers: ["7", "8", "9", "10", "11", "12"] },
  { name: "Line 3", numbers: ["13", "14", "15", "16", "17", "18"] },
  { name: "Line 4", numbers: ["19", "20", "21", "22", "23", "24"] },
  { name: "Line 5", numbers: ["25", "26", "27", "28", "29", "30"] },
  { name: "Line 6", numbers: ["31", "32", "33", "34", "35", "36"] },
];

// Define column groups
const columnGroups = [
  { name: "Column 1", numbers: ["1","4","7","10","13","16","19","22","25","28","31","34"] },
  { name: "Column 2", numbers: ["2","5","8","11","14","17","20","23","26","29","32","35"] },
  { name: "Column 3", numbers: ["3","6","9","12","15","18","21","24","27","30","33","36"] },
];

// For coloring red/black/green in standard layout
const redNumbers = [
  "1","3","5","7","9","12","14","16","18","19","21","23","25","27","30","32","34","36"
];

// Element references
const rouletteTypeSelectionDiv = document.getElementById("rouletteTypeSelection");
const bankrollSectionDiv = document.getElementById("bankrollSection");
const numberInputSectionDiv = document.getElementById("numberInputSection");
const heatmapOptionsDiv = document.getElementById("heatmapOptions");
const heatmapDisplayDiv = document.getElementById("heatmapDisplay");
const selectedNumbersDisplay = document.getElementById("selectedNumbersDisplay");
const numberGridDiv = document.getElementById("numberGrid");
const resetButton = document.getElementById("resetNumbers");

const betSuggestionAreaDiv = document.getElementById("betSuggestionArea");
const bankrollDisplay = document.getElementById("bankrollDisplay");
const suggestedBetDisplay = document.getElementById("suggestedBetDisplay");
const betSizeDisplay = document.getElementById("betSizeDisplay");
const progressionStepDisplay = document.getElementById("progressionStepDisplay");
const winProbabilityDisplay = document.getElementById("winProbabilityDisplay");
const lastBetResultDisplay = document.getElementById("lastBetResultDisplay");

// Toggle Betting button & status text
const toggleBettingBtn = document.getElementById("toggleBettingBtn");
const bettingStatusMsg = document.getElementById("bettingStatusMsg");

// =========== EVENT HANDLERS ===========

// 1) Choose Table Type
document.getElementById("confirmType").addEventListener("click", function () {
  const radios = document.getElementsByName("tableType");
  for (let radio of radios) {
    if (radio.checked) {
      tableType = radio.value;
      break;
    }
  }
  rouletteTypeSelectionDiv.classList.add("d-none");
  bankrollSectionDiv.classList.remove("d-none");
});

// 2) Bankroll & Settings
const stakeStyleRadios = document.getElementsByName("stakeStyle");
stakeStyleRadios.forEach((radio) => {
  radio.addEventListener("change", function () {
    stakeStyle = this.value;
    toggleBetInput();
  });
});

function toggleBetInput() {
  const baseBetRow = document.getElementById("baseBetRow");
  const basePercentRow = document.getElementById("basePercentRow");
  if (stakeStyle === "fixed") {
    baseBetRow.classList.remove("d-none");
    basePercentRow.classList.add("d-none");
  } else {
    baseBetRow.classList.add("d-none");
    basePercentRow.classList.remove("d-none");
  }
}

document.getElementById("confirmBankroll").addEventListener("click", function () {
  bankroll = parseInt(document.getElementById("bankrollInput").value) || 1000;
  stakeStyle = [...stakeStyleRadios].find((r) => r.checked).value;
  baseBet = parseInt(document.getElementById("baseBetInput").value) || 10;
  basePercent = parseInt(document.getElementById("basePercentInput").value) || 10;
  roundingFactor = parseInt(
    [...document.getElementsByName("rounding")].find((r) => r.checked).value
  );
  betProgression = [...document.getElementsByName("betProgression")].find(
    (r) => r.checked
  ).value;

  bankrollSectionDiv.classList.add("d-none");
  setupNumberGrid();
  numberInputSectionDiv.classList.remove("d-none");
  updateLineCounters();
  updateColumnCounters();
  betSuggestionAreaDiv.classList.remove("d-none");
  updateBetSuggestion();
  displayBankroll();
});

// 3) Setup the number grid
function setupNumberGrid() {
  numberGridDiv.innerHTML = "";
  let numbers = [];
  if (tableType === "european") {
    numbers.push("0");
    for (let i = 1; i <= 36; i++) {
      numbers.push(i.toString());
    }
  } else {
    numbers.push("0", "00");
    for (let i = 1; i <= 36; i++) {
      numbers.push(i.toString());
    }
  }

  numbers.forEach((num) => {
    let btn = document.createElement("button");
    btn.textContent = num;
    btn.className = "roulette-button";
    btn.dataset.number = num;
    btn.dataset.count = 0;
    btn.addEventListener("click", function () {
      selectedNumbers.push(num);
      updateSelectedNumbersDisplay();
      let currentCount = parseInt(btn.dataset.count);
      currentCount++;
      btn.dataset.count = currentCount;
      btn.textContent = num + (currentCount > 0 ? ` (${currentCount})` : "");

      if (selectedNumbers.length >= minSpinsForHeatmap) {
        heatmapOptionsDiv.classList.remove("d-none");
      }
      if (currentHeatmapLayout !== null) {
        displayHeatmap(currentHeatmapLayout);
      }
      updateLineCounters();
      updateColumnCounters();

      // --- IMPORTANT: only run bet logic if betting is ON
      if (bettingActive) {
        checkLastBetResult(num);
        updateBetSuggestion();
      }
    });
    numberGridDiv.appendChild(btn);
  });
}

// 4) Update displayed selected numbers
function updateSelectedNumbersDisplay() {
  selectedNumbersDisplay.textContent = selectedNumbers.join(", ");
}

// 5) Gap Counters
function updateLineCounters() {
  let displayHTML = "<h3>Line Gaps</h3>";
  lineGroups.forEach((group) => {
    let gap = getGroupGap(lineGroups, group.name);
    displayHTML += `<p>${group.name}: ${gap} spin(s) since win</p>`;
  });
  document.getElementById("lineCounterDisplay").innerHTML = displayHTML;
}

function updateColumnCounters() {
  let displayHTML = "<h3>Column Gaps</h3>";
  columnGroups.forEach((group) => {
    let gap = getGroupGap(columnGroups, group.name);
    displayHTML += `<p>${group.name}: ${gap} spin(s) since win</p>`;
  });
  document.getElementById("columnCounterDisplay").innerHTML = displayHTML;
}

// 6) Heatmap
document.getElementById("showStandardHeatmap").addEventListener("click", function () {
  currentHeatmapLayout = "standard";
  displayHeatmap("standard");
});
document
  .getElementById("showRacetrackHeatmap")
  .addEventListener("click", function () {
    currentHeatmapLayout = "racetrack";
    displayHeatmap("racetrack");
  });

function displayHeatmap(layoutType) {
  heatmapDisplayDiv.innerHTML = "";
  heatmapDisplayDiv.classList.remove("d-none");
  const frequencies = getNumberFrequencies();
  if (layoutType === "standard") {
    displayStandardTable(frequencies);
  } else {
    displayRacetrack(frequencies);
  }
}

function getNumberFrequencies() {
  let frequencies = {};
  let possibleNumbers = [];
  if (tableType === "european") {
    possibleNumbers.push("0");
    for (let i = 1; i <= 36; i++) {
      possibleNumbers.push(i.toString());
    }
  } else {
    possibleNumbers.push("0", "00");
    for (let i = 1; i <= 36; i++) {
      possibleNumbers.push(i.toString());
    }
  }
  possibleNumbers.forEach((num) => (frequencies[num] = 0));
  selectedNumbers.forEach((num) => {
    if (frequencies[num] !== undefined) {
      frequencies[num]++;
    }
  });
  return frequencies;
}

// Standard table with colored borders
function displayStandardTable(frequencies) {
  let table = document.createElement("table");
  table.className = "table table-sm table-bordered text-center w-auto mx-auto roulette-table";
  
  if (tableType === "european") {
    // Top row: 0 spanning three columns
    let row0 = document.createElement("tr");
    let cell0 = createRouletteCell("0", frequencies["0"]);
    cell0.colSpan = 3;
    row0.appendChild(cell0);
    table.appendChild(row0);

    // Rows for 1-36 in 12 rows of 3 columns
    for (let i = 0; i < 12; i++) {
      let row = document.createElement("tr");
      for (let j = 0; j < 3; j++) {
        let num = (i * 3 + j + 1).toString();
        let cell = createRouletteCell(num, frequencies[num]);
        row.appendChild(cell);
      }
      table.appendChild(row);
    }
  } else {
    // American: top row with 0 and 00
    let row0 = document.createElement("tr");
    let cell0 = createRouletteCell("0", frequencies["0"]);
    row0.appendChild(cell0);
    let cell00 = createRouletteCell("00", frequencies["00"]);
    cell00.colSpan = 2;
    row0.appendChild(cell00);
    table.appendChild(row0);

    // Then rows for 1-36
    for (let i = 0; i < 12; i++) {
      let row = document.createElement("tr");
      for (let j = 0; j < 3; j++) {
        let num = (i * 3 + j + 1).toString();
        let cell = createRouletteCell(num, frequencies[num]);
        row.appendChild(cell);
      }
      table.appendChild(row);
    }
  }

  heatmapDisplayDiv.appendChild(table);
}

function createRouletteCell(num, freq) {
  let cell = document.createElement("td");
  cell.textContent = num;
  cell.classList.add("heatmap-cell");
  // Heatmap shading
  cell.style.backgroundColor = getColorForCount(freq);

  // Border color
  if (num === "0" || num === "00") {
    cell.classList.add("green-cell");
  } else if (redNumbers.includes(num)) {
    cell.classList.add("red-cell");
  } else {
    cell.classList.add("black-cell");
  }
  return cell;
}

// Racetrack
function displayRacetrack(frequencies) {
  let racetrackDiv = document.createElement("div");
  racetrackDiv.className = "d-flex flex-wrap justify-content-center";
  let wheelOrder = [];
  if (tableType === "european") {
    wheelOrder = [
      "0","32","15","19","4","21","2","25","17","34","6","27","13","36",
      "11","30","8","23","10","5","24","16","33","1","20","14","31","9",
      "22","18","29","7","28","12","35","3","26"
    ];
  } else {
    wheelOrder = [
      "0","28","9","26","30","11","7","20","32","17","5","22","34","15","3",
      "24","36","13","1","00","27","10","25","29","12","8","19","31","18",
      "6","21","4","2","23","35","14","16"
    ];
  }
  wheelOrder.forEach((num) => {
    let box = document.createElement("div");
    box.textContent = num;
    box.style.width = "40px";
    box.style.height = "40px";
    box.style.display = "flex";
    box.style.justifyContent = "center";
    box.style.alignItems = "center";
    box.style.margin = "2px";
    box.style.border = "1px solid #000";
    box.style.borderRadius = "4px";
    box.style.backgroundColor = getColorForCount(frequencies[num] || 0);
    racetrackDiv.appendChild(box);
  });
  heatmapDisplayDiv.appendChild(racetrackDiv);
}

function getColorForCount(count) {
  if (count === 0) return "#fff";
  if (count === 1) return "#ffcccc";
  if (count === 2) return "#ff9999";
  if (count >= 3) return "#ff6666";
  return "#fff";
}

// 7) Reset
resetButton.addEventListener("click", function () {
  selectedNumbers = [];
  updateSelectedNumbersDisplay();
  if (selectedNumbers.length < minSpinsForHeatmap) {
    heatmapOptionsDiv.classList.add("d-none");
  }
  const buttons = numberGridDiv.getElementsByClassName("roulette-button");
  for (let btn of buttons) {
    btn.dataset.count = 0;
    btn.textContent = btn.dataset.number;
  }
  heatmapDisplayDiv.innerHTML = "";
  heatmapDisplayDiv.classList.add("d-none");
  currentHeatmapLayout = null;
  updateLineCounters();
  updateColumnCounters();
  currentBet.betType = null;
  currentBet.betTarget = null;
  currentBet.betSize = 0;
  consecutiveLosses = 0;
  displayBankroll();
  updateBetSuggestion(true);
  lastBetResultDisplay.textContent = "N/A";
});

/* =========== TOGGLE BETTING =========== */
toggleBettingBtn.addEventListener("click", function () {
  bettingActive = !bettingActive;
  if (bettingActive) {
    toggleBettingBtn.textContent = "Stop Betting";
    bettingStatusMsg.innerHTML = `Betting is currently <strong>ON</strong>.`;
  } else {
    toggleBettingBtn.textContent = "Start Betting";
    bettingStatusMsg.innerHTML = `Betting is currently <strong>OFF</strong>.`;
  }
});

/* =============== BET PROGRESSION & LOGIC =============== */
function roundBetSize(value) {
  return Math.ceil(value / roundingFactor) * roundingFactor;
}

// Martingale
function getNextBetMartingale(losses, base) {
  return base * 2 ** losses;
}

// Fibonacci
function getNextBetFibonacci(losses, base) {
  function fib(n) {
    if (n <= 1) return 1;
    let a = 1, b = 1;
    for (let i = 2; i <= n; i++) {
      let temp = a + b;
      a = b;
      b = temp;
    }
    return b;
  }
  return base * fib(losses);
}

// Padovan
function getNextBetPadovan(losses, base) {
  function padovan(n) {
    if (n < 3) return 1;
    let p0 = 1, p1 = 1, p2 = 1;
    let p;
    for (let i = 3; i <= n; i++) {
      p = p0 + p1;
      p0 = p1;
      p1 = p2;
      p2 = p;
    }
    return p;
  }
  return base * padovan(losses);
}

function checkLastBetResult(latestNumber) {
  // If we haven't assigned a bet or bet size, skip
  if (!currentBet.betTarget || !currentBet.betType || currentBet.betSize === 0) return;

  let groupArray = currentBet.betType === "line" ? lineGroups : columnGroups;
  let targetGroup = groupArray.find((g) => g.name === currentBet.betTarget);
  if (!targetGroup) return;

  if (targetGroup.numbers.includes(latestNumber)) {
    lastBetResultDisplay.textContent = "WIN";
    let multiplier = currentBet.betType === "line" ? 5 : 2;
    let winAmount = currentBet.betSize * multiplier;
    bankroll += winAmount;
    consecutiveLosses = 0;
  } else {
    lastBetResultDisplay.textContent = "LOSS";
    bankroll -= currentBet.betSize;
    consecutiveLosses++;
  }
  displayBankroll();
}

function updateBetSuggestion(resetToNA = false) {
  if (resetToNA) {
    suggestedBetDisplay.textContent = "N/A";
    betSizeDisplay.textContent = "N/A";
    progressionStepDisplay.textContent = "N/A";
    winProbabilityDisplay.textContent = "N/A";
    return;
  }
  if (selectedNumbers.length < 5) {
    suggestedBetDisplay.textContent = "Not enough spins yet...";
    betSizeDisplay.textContent = "N/A";
    progressionStepDisplay.textContent = "N/A";
    winProbabilityDisplay.textContent = "N/A";
    return;
  }

  // If betting is OFF => show "Betting is OFF" and do not update bet size
  if (!bettingActive) {
    suggestedBetDisplay.textContent = "Betting is OFF";
    betSizeDisplay.textContent = "0";
    progressionStepDisplay.textContent = "N/A";
    winProbabilityDisplay.textContent = "N/A";
    return;
  }

  // 1) Pick the group with the highest gap
  let bestLine = getMaxGapGroup(lineGroups);
  let bestColumn = getMaxGapGroup(columnGroups);
  if (bestLine.gap >= bestColumn.gap) {
    currentBet.betType = "line";
    currentBet.betTarget = bestLine.name;
  } else {
    currentBet.betType = "column";
    currentBet.betTarget = bestColumn.name;
  }

  // 2) Calculate next bet size
  let baseStake = 0;
  if (stakeStyle === "fixed") {
    baseStake = baseBet;
  } else {
    baseStake = Math.floor((bankroll * basePercent) / 100);
    if (baseStake < 1) baseStake = 1;
  }

  let nextBet = 0;
  if (consecutiveLosses === 0) {
    nextBet = baseStake;
  } else {
    if (betProgression === "martingale") {
      nextBet = getNextBetMartingale(consecutiveLosses, baseStake);
    } else if (betProgression === "fibonacci") {
      nextBet = getNextBetFibonacci(consecutiveLosses, baseStake);
    } else {
      nextBet = getNextBetPadovan(consecutiveLosses, baseStake);
    }
  }
  nextBet = roundBetSize(nextBet);
  currentBet.betSize = nextBet;

  // 3) Update UI
  suggestedBetDisplay.textContent = `${currentBet.betTarget} (${currentBet.betType})`;
  betSizeDisplay.textContent = currentBet.betSize.toString();
  progressionStepDisplay.textContent = consecutiveLosses.toString();

  // 4) Calculate approximate win probability
  let baseProbability = 0;
  if (tableType === "european") {
    baseProbability = currentBet.betType === "line" ? 6 / 37 : 12 / 37;
  } else {
    baseProbability = currentBet.betType === "line" ? 6 / 38 : 12 / 38;
  }
  let gap = getGroupGap(
    currentBet.betType === "line" ? lineGroups : columnGroups,
    currentBet.betTarget
  );
  let winProbability = 1 - Math.pow(1 - baseProbability, gap + 1);
  winProbabilityDisplay.textContent = (winProbability * 100).toFixed(1) + "%";
}

function getMaxGapGroup(groupArray) {
  let bestGroup = { name: "", gap: -1 };
  for (let group of groupArray) {
    let gap = getGroupGap(groupArray, group.name);
    if (gap > bestGroup.gap) {
      bestGroup.name = group.name;
      bestGroup.gap = gap;
    }
  }
  return bestGroup;
}

function getGroupGap(groupArray, targetName) {
  let group = groupArray.find((g) => g.name === targetName);
  if (!group) return 0;
  let lastIndex = -1;
  for (let i = selectedNumbers.length - 1; i >= 0; i--) {
    if (group.numbers.includes(selectedNumbers[i])) {
      lastIndex = i;
      break;
    }
  }
  return lastIndex === -1
    ? selectedNumbers.length
    : selectedNumbers.length - lastIndex - 1;
}

function displayBankroll() {
  bankrollDisplay.textContent = bankroll.toString();
}
