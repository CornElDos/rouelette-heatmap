// betSuggestion.js - Funktioner för bet-suggestion, progression och win probability

import { roundBetSize, getNextBetMartingale, getNextBetFibonacci, getNextBetPadovan } from "./helpers.js";
import { getMaxGapGroup, getGroupGap } from "./gapCounters.js";

// Vi exporterar variabler för att hålla reda på progressionen
export let consecutiveLosses = 0;
export let currentBet = {
  betType: null, // "line" eller "column"
  betTarget: null,
  betSize: 0
};

// Uppdaterar bet-suggestion baserat på selectedNumbers och andra parametrar
export function updateBetSuggestion(params) {
  // params innehåller: selectedNumbers, bankroll, stakeStyle, baseBet, basePercent, roundingFactor,
  // betProgression, tableType, lineGroups, columnGroups, bettingActive, elements (referenser till UI-element)
  const {
    selectedNumbers,
    bankroll,
    stakeStyle,
    baseBet,
    basePercent,
    roundingFactor,
    betProgression,
    tableType,
    lineGroups,
    columnGroups,
    bettingActive,
    elements
  } = params;
  
  if (selectedNumbers.length < 5) {
    elements.suggestedBetDisplay.textContent = "Not enough spins yet...";
    elements.betSizeDisplay.textContent = "N/A";
    elements.progressionStepDisplay.textContent = "N/A";
    updateWinProbability(params);
    return;
  }
  
  // Om betting är avstängt, visa meddelande och avbryt
  if (!bettingActive) {
    elements.suggestedBetDisplay.textContent = "Betting is OFF";
    elements.betSizeDisplay.textContent = "0";
    elements.progressionStepDisplay.textContent = "N/A";
    updateWinProbability(params);
    return;
  }
  
  // Välj den grupp med högst gap
  const bestLine = getMaxGapGroup(lineGroups, selectedNumbers);
  const bestColumn = getMaxGapGroup(columnGroups, selectedNumbers);
  if (bestLine.gap >= bestColumn.gap) {
    currentBet.betType = "line";
    currentBet.betTarget = bestLine.name;
  } else {
    currentBet.betType = "column";
    currentBet.betTarget = bestColumn.name;
  }
  
  // Beräkna basinsats
  let baseStake = (stakeStyle === "fixed") ? baseBet : Math.floor((bankroll * basePercent) / 100);
  if (baseStake < 1) baseStake = 1;
  
  // Beräkna nästa bet baserat på progression
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
  nextBet = roundBetSize(nextBet, roundingFactor);
  currentBet.betSize = nextBet;
  
  // Uppdatera UI
  elements.suggestedBetDisplay.textContent = `${currentBet.betTarget} (${currentBet.betType})`;
  elements.betSizeDisplay.textContent = currentBet.betSize.toString();
  elements.progressionStepDisplay.textContent = consecutiveLosses.toString();
  updateWinProbability(params);
}

// Uppdaterar win probability baserat på bästa gruppens gap
export function updateWinProbability(params) {
  const {
    selectedNumbers,
    tableType,
    lineGroups,
    columnGroups,
    elements
  } = params;
  
  if (selectedNumbers.length < 5) {
    elements.winProbabilityDisplay.textContent = "N/A";
    return;
  }
  
  const bestLine = getMaxGapGroup(lineGroups, selectedNumbers);
  const bestColumn = getMaxGapGroup(columnGroups, selectedNumbers);
  let targetGroup, baseProbability;
  if (bestLine.gap >= bestColumn.gap) {
    targetGroup = bestLine;
    baseProbability = tableType === "european" ? 6 / 37 : 6 / 38;
  } else {
    targetGroup = bestColumn;
    baseProbability = tableType === "european" ? 12 / 37 : 12 / 38;
  }
  
  const winProbability = 1 - Math.pow(1 - baseProbability, targetGroup.gap + 1);
  elements.winProbabilityDisplay.textContent = (winProbability * 100).toFixed(1) + "%";
}

export function initBetSuggestion() {
  // Om du behöver initialisera något i UI:t för bet-suggestion kan du göra det här.
}
