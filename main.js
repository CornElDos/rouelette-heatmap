/* main.js - Ingångspunkt för applikationen */

import { roundBetSize, getNextBetMartingale, getNextBetFibonacci, getNextBetPadovan } from "./helpers.js";
import { displayHeatmap } from "./heatmap.js";
import { updateLineCounters, updateColumnCounters } from "./gapCounters.js";
import { updateBetSuggestion, initBetSuggestion, consecutiveLosses, currentBet } from "./betSuggestion.js";

// Globala variabler
let tableType = "european";
let selectedNumbers = [];
const minSpinsForHeatmap = 5;
let currentHeatmapLayout = null;

// Bankroll & betting
let bankroll = 1000;
let stakeStyle = "fixed";
let baseBet = 10;
let basePercent = 10;
let roundingFactor = 5;
let betProgression = "martingale";
let bettingActive = false; // togglas via "Start Betting" / "Stop Betting"

// Line & Column groups
const lineGroups = [
  { name: "Line 1", numbers: ["1","2","3","4","5","6"] },
  { name: "Line 2", numbers: ["7","8","9","10","11","12"] },
  { name: "Line 3", numbers: ["13","14","15","16","17","18"] },
  { name: "Line 4", numbers: ["19","20","21","22","23","24"] },
  { name: "Line 5", numbers: ["25","26","27","28","29","30"] },
  { name: "Line 6", numbers: ["31","32","33","34","35","36"] },
];
const columnGroups = [
  { name: "Column 1", numbers: ["1","4","7","10","13","16","19","22","25","28","31","34"] },
  { name: "Column 2", numbers: ["2","5","8","11","14","17","20","23","26","29","32","35"] },
  { name: "Column 3", numbers: ["3","6","9","12","15","18","21","24","27","30","33","36"] },
];

// För standard layout-färg
const redNumbers = ["1","3","5","7","9","12","14","16","18","19","21","23","25","27","30","32","34","36"];

// Hämta elementreferenser
const rouletteTypeSelectionDiv = document.getElementById("rouletteTypeSelection");
const bankrollSectionDiv = document.getElementById("bankrollSection");
const numberInputSectionDiv = document.getElementById("numberInputSection");
const heatmapOptionsDiv = document.getElementById("heatmapOptions");
const heatmapDisplayDiv = document.getElementById("heatmapDisplay");
const selectedNumbersDisplay = document.getElementById("selectedNumbersDisplay");
const numberGridDiv = document.getElementById("numberGrid");
const resetButton = document.getElementById("resetNumbers");

const bankrollDisplay = document.getElementById("bankrollDisplay");
const suggestedBetDisplay = document.getElementById("suggestedBetDisplay");
const betSizeDisplay = document.getElementById("betSizeDisplay");
const progressionStepDisplay = document.getElementById("progressionStepDisplay");
const winProbabilityDisplay = document.getElementById("winProbabilityDisplay");
const lastBetResultDisplay = document.getElementById("lastBetResultDisplay");

// Toggle Betting
const toggleBettingBtn = document.getElementById("toggleBettingBtn");
const bettingStatusMsg = document.getElementById("bettingStatusMsg");

// När DOM laddats
document.addEventListener("DOMContentLoaded", () => {
  // 1. Bekräfta bordstyp
  document.getElementById("confirmType").addEventListener("click", () => {
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

  // 2. Hantera stake style
  const stakeStyleRadios = document.getElementsByName("stakeStyle");
  stakeStyleRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      stakeStyle = radio.value;
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

  // 3. Bekräfta Bankroll & Settings
  document.getElementById("confirmBankroll").addEventListener("click", () => {
    bankroll = parseInt(document.getElementById("bankrollInput").value) || 1000;
    stakeStyle = [...stakeStyleRadios].find(r => r.checked).value;
    baseBet = parseInt(document.getElementById("baseBetInput").value) || 10;
    basePercent = parseInt(document.getElementById("basePercentInput").value) || 10;
    roundingFactor = parseInt([...document.getElementsByName("rounding")].find(r => r.checked).value);
    betProgression = [...document.getElementsByName("betProgression")].find(r => r.checked).value;

    bankrollSectionDiv.classList.add("d-none");
    setupNumberGrid();
    numberInputSectionDiv.classList.remove("d-none");

    updateLineCounters(lineGroups, selectedNumbers, document.getElementById("lineCounterDisplay"));
    updateColumnCounters(columnGroups, selectedNumbers, document.getElementById("columnCounterDisplay"));

    // Visa Bet Suggestion
    document.getElementById("betSuggestionArea").classList.remove("d-none");
    initBetSuggestion();
    updateBetSuggestion({
      selectedNumbers, bankroll, stakeStyle, baseBet, basePercent, roundingFactor,
      betProgression, tableType, lineGroups, columnGroups, bettingActive,
      elements: { suggestedBetDisplay, betSizeDisplay, progressionStepDisplay, winProbabilityDisplay }
    });
    displayBankroll();
  });

  // 4. Setup Number Grid
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
    numbers.forEach(num => {
      const btn = document.createElement("button");
      btn.textContent = num;
      btn.className = "roulette-button";
      btn.dataset.number = num;
      btn.dataset.count = 0;
      btn.addEventListener("click", () => {
        selectedNumbers.push(num);
        selectedNumbersDisplay.textContent = selectedNumbers.join(", ");

        let currentCount = parseInt(btn.dataset.count);
        currentCount++;
        btn.dataset.count = currentCount;
        btn.textContent = num + (currentCount > 0 ? ` (${currentCount})` : "");

        if (selectedNumbers.length >= minSpinsForHeatmap) {
          heatmapOptionsDiv.classList.remove("d-none");
        }
        if (currentHeatmapLayout !== null) {
          const heatmapEl = displayHeatmap(currentHeatmapLayout, selectedNumbers, tableType, redNumbers);
          heatmapDisplayDiv.innerHTML = "";
          heatmapDisplayDiv.classList.remove("d-none");
          heatmapDisplayDiv.appendChild(heatmapEl);
        }
        updateLineCounters(lineGroups, selectedNumbers, document.getElementById("lineCounterDisplay"));
        updateColumnCounters(columnGroups, selectedNumbers, document.getElementById("columnCounterDisplay"));

        // Endast om betting är på
        if (bettingActive) {
          checkLastBetResult(num);
          updateBetSuggestion({
            selectedNumbers, bankroll, stakeStyle, baseBet, basePercent, roundingFactor,
            betProgression, tableType, lineGroups, columnGroups, bettingActive,
            elements: { suggestedBetDisplay, betSizeDisplay, progressionStepDisplay, winProbabilityDisplay }
          });
        }
      });
      numberGridDiv.appendChild(btn);
    });
  }

  // 5. Reset-knapp
  resetButton.addEventListener("click", () => {
    selectedNumbers = [];
    selectedNumbersDisplay.textContent = "";
    heatmapOptionsDiv.classList.add("d-none");
    Array.from(numberGridDiv.getElementsByClassName("roulette-button")).forEach(btn => {
      btn.dataset.count = 0;
      btn.textContent = btn.dataset.number;
    });
    heatmapDisplayDiv.innerHTML = "";
    heatmapDisplayDiv.classList.add("d-none");
    currentHeatmapLayout = null;

    updateLineCounters(lineGroups, selectedNumbers, document.getElementById("lineCounterDisplay"));
    updateColumnCounters(columnGroups, selectedNumbers, document.getElementById("columnCounterDisplay"));
    currentBet.betType = null;
    currentBet.betTarget = null;
    currentBet.betSize = 0;
    consecutiveLosses = 0;
    displayBankroll();
    updateBetSuggestion({
      selectedNumbers, bankroll, stakeStyle, baseBet, basePercent, roundingFactor,
      betProgression, tableType, lineGroups, columnGroups, bettingActive,
      elements: { suggestedBetDisplay, betSizeDisplay, progressionStepDisplay, winProbabilityDisplay }
    });
    lastBetResultDisplay.textContent = "N/A";
  });

  // 6. Toggle Betting
  toggleBettingBtn.addEventListener("click", () => {
    bettingActive = !bettingActive;
    if (bettingActive) {
      toggleBettingBtn.textContent = "Stop Betting";
      bettingStatusMsg.innerHTML = `Betting is currently <strong>ON</strong>.`;
    } else {
      toggleBettingBtn.textContent = "Start Betting";
      bettingStatusMsg.innerHTML = `Betting is currently <strong>OFF</strong>.`;
    }
    updateBetSuggestion({
      selectedNumbers, bankroll, stakeStyle, baseBet, basePercent, roundingFactor,
      betProgression, tableType, lineGroups, columnGroups, bettingActive,
      elements: { suggestedBetDisplay, betSizeDisplay, progressionStepDisplay, winProbabilityDisplay }
    });
  });

  // 7. Heatmap-knappar
  document.getElementById("showStandardHeatmap").addEventListener("click", () => {
    currentHeatmapLayout = "standard";
    const heatmapEl = displayHeatmap("standard", selectedNumbers, tableType, redNumbers);
    heatmapDisplayDiv.innerHTML = "";
    heatmapDisplayDiv.classList.remove("d-none");
    heatmapDisplayDiv.appendChild(heatmapEl);
  });

  document.getElementById("showRacetrackHeatmap").addEventListener("click", () => {
    currentHeatmapLayout = "racetrack";
    const heatmapEl = displayHeatmap("racetrack", selectedNumbers, tableType, redNumbers);
    heatmapDisplayDiv.innerHTML = "";
    heatmapDisplayDiv.classList.remove("d-none");
    heatmapDisplayDiv.appendChild(heatmapEl);
  });

  // 8. checkLastBetResult
  function checkLastBetResult(latestNumber) {
    if (!currentBet.betTarget || !currentBet.betType || currentBet.betSize === 0) return;
    const groupArray = currentBet.betType === "line" ? lineGroups : columnGroups;
    const targetGroup = groupArray.find(g => g.name === currentBet.betTarget);
    if (!targetGroup) return;
    if (targetGroup.numbers.includes(latestNumber)) {
      lastBetResultDisplay.textContent = "WIN";
      const multiplier = (currentBet.betType === "line") ? 5 : 2;
      const winAmount = currentBet.betSize * multiplier;
      bankroll += winAmount;
      consecutiveLosses = 0;
    } else {
      lastBetResultDisplay.textContent = "LOSS";
      bankroll -= currentBet.betSize;
      consecutiveLosses++;
    }
    displayBankroll();
  }

  function displayBankroll() {
    bankrollDisplay.textContent = bankroll.toString();
  }
});
