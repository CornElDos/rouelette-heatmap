/* main.js - Ingångspunkt för applikationen */

import { roundBetSize, getNextBetMartingale, getNextBetFibonacci, getNextBetPadovan } from "./helpers.js";
import { displayHeatmap } from "./heatmap.js";
import { updateLineCounters, updateColumnCounters, updateDoubleStreetCounters, updateSingleStreetCounters, updateDozenCounters } from "./gapCounters.js";
import { updateBetSuggestion, initBetSuggestion, currentBet } from "./betSuggestion.js";

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

// Hantera antalet förlustspel
let losses = 0;

// Definiera grupper
// Double Street = grupper med 6 nummer (tidigare lineGroups)
const doubleStreetGroups = [
  { name: "Double Street 1", numbers: ["1","2","3","4","5","6"] },
  { name: "Double Street 2", numbers: ["7","8","9","10","11","12"] },
  { name: "Double Street 3", numbers: ["13","14","15","16","17","18"] },
  { name: "Double Street 4", numbers: ["19","20","21","22","23","24"] },
  { name: "Double Street 5", numbers: ["25","26","27","28","29","30"] },
  { name: "Double Street 6", numbers: ["31","32","33","34","35","36"] },
];

// Single Street = grupper med 3 nummer (12 rader)
const singleStreetGroups = [
  { name: "Single Street 1", numbers: ["1","2","3"] },
  { name: "Single Street 2", numbers: ["4","5","6"] },
  { name: "Single Street 3", numbers: ["7","8","9"] },
  { name: "Single Street 4", numbers: ["10","11","12"] },
  { name: "Single Street 5", numbers: ["13","14","15"] },
  { name: "Single Street 6", numbers: ["16","17","18"] },
  { name: "Single Street 7", numbers: ["19","20","21"] },
  { name: "Single Street 8", numbers: ["22","23","24"] },
  { name: "Single Street 9", numbers: ["25","26","27"] },
  { name: "Single Street 10", numbers: ["28","29","30"] },
  { name: "Single Street 11", numbers: ["31","32","33"] },
  { name: "Single Street 12", numbers: ["34","35","36"] },
];

// Dozen = grupper med 12 nummer (1-12, 13-24, 25-36)
const dozenGroups = [
  { name: "Dozen 1", numbers: ["1","2","3","4","5","6","7","8","9","10","11","12"] },
  { name: "Dozen 2", numbers: ["13","14","15","16","17","18","19","20","21","22","23","24"] },
  { name: "Dozen 3", numbers: ["25","26","27","28","29","30","31","32","33","34","35","36"] },
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

// För gap-räknare – vi använder nu nya element
const doubleStreetCounterDisplay = document.getElementById("doubleStreetCounterDisplay");
const singleStreetCounterDisplay = document.getElementById("singleStreetCounterDisplay");
const dozenCounterDisplay = document.getElementById("dozenCounterDisplay");
const totalSpinsDisplay = document.getElementById("totalSpinsDisplay");

// Toggle Betting
const toggleBettingBtn = document.getElementById("toggleBettingBtn");
const bettingStatusMsg = document.getElementById("bettingStatusMsg");

// När DOM laddats
document.addEventListener("DOMContentLoaded", () => {
  // 1. Välj bordstyp
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

    // Uppdatera gap-räknare
    updateDoubleStreetCounters(doubleStreetGroups, selectedNumbers, doubleStreetCounterDisplay);
    updateSingleStreetCounters(singleStreetGroups, selectedNumbers, singleStreetCounterDisplay);
    updateDozenCounters(dozenGroups, selectedNumbers, dozenCounterDisplay);
    totalSpinsDisplay.textContent = `Total Spins: ${selectedNumbers.length}`;

    // Visa Bet Suggestion
    document.getElementById("betSuggestionArea").classList.remove("d-none");
    initBetSuggestion();
    updateBetSuggestion({
      selectedNumbers, bankroll, stakeStyle, baseBet, basePercent, roundingFactor,
      betProgression, tableType, lineGroups: doubleStreetGroups, columnGroups, bettingActive, losses,
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
        updateDoubleStreetCounters(doubleStreetGroups, selectedNumbers, doubleStreetCounterDisplay);
        updateSingleStreetCounters(singleStreetGroups, selectedNumbers, singleStreetCounterDisplay);
        updateDozenCounters(dozenGroups, selectedNumbers, dozenCounterDisplay);
        totalSpinsDisplay.textContent = `Total Spins: ${selectedNumbers.length}`;

        // Endast om betting är aktivt
        if (bettingActive) {
          checkLastBetResult(num);
          updateBetSuggestion({
            selectedNumbers, bankroll, stakeStyle, baseBet, basePercent, roundingFactor,
            betProgression, tableType, lineGroups: doubleStreetGroups, columnGroups, bettingActive, losses,
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

    updateDoubleStreetCounters(doubleStreetGroups, selectedNumbers, doubleStreetCounterDisplay);
    updateSingleStreetCounters(singleStreetGroups, selectedNumbers, singleStreetCounterDisplay);
    updateDozenCounters(dozenGroups, selectedNumbers, dozenCounterDisplay);
    totalSpinsDisplay.textContent = `Total Spins: ${selectedNumbers.length}`;
    
    currentBet.betType = null;
    currentBet.betTarget = null;
    currentBet.betSize = 0;
    losses = 0;
    displayBankroll();
    updateBetSuggestion({
      selectedNumbers, bankroll, stakeStyle, baseBet, basePercent, roundingFactor,
      betProgression, tableType, lineGroups: doubleStreetGroups, columnGroups, bettingActive, losses,
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
      betProgression, tableType, lineGroups: doubleStreetGroups, columnGroups, bettingActive, losses,
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
    const groupArray = currentBet.betType === "line" ? doubleStreetGroups : columnGroups;
    const targetGroup = groupArray.find(g => g.name === currentBet.betTarget);
    if (!targetGroup) return;
    if (targetGroup.numbers.includes(latestNumber)) {
      lastBetResultDisplay.textContent = "WIN";
      const multiplier = (currentBet.betType === "line") ? 5 : 2;
      const winAmount = currentBet.betSize * multiplier;
      bankroll += winAmount;
      losses = 0;
    } else {
      lastBetResultDisplay.textContent = "LOSS";
      bankroll -= currentBet.betSize;
      losses++;
    }
    displayBankroll();
  }

  function displayBankroll() {
    bankrollDisplay.textContent = bankroll.toString();
  }
});
